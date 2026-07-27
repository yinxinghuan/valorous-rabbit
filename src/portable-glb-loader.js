/*
 * Minimal GLB 2.0 loader for the shared low-poly library.
 * The game intentionally stays on upstream Three r80 for visual parity, so
 * this adapter consumes the factory's static primitive GLBs without replacing
 * the original renderer or introducing a second Three runtime.
 */

const COMPONENT_READERS = {
  5120: ['getInt8', Int8Array, 1],
  5121: ['getUint8', Uint8Array, 1],
  5122: ['getInt16', Int16Array, 2],
  5123: ['getUint16', Uint16Array, 2],
  5125: ['getUint32', Uint32Array, 4],
  5126: ['getFloat32', Float32Array, 4],
};

const TYPE_SIZE = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16,
};

function parseGlb(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error('Invalid GLB magic');
  if (view.getUint32(4, true) !== 2) throw new Error('Unsupported GLB version');
  let json = null;
  let binary = null;
  let offset = 12;
  while (offset < arrayBuffer.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (type === 0x4e4f534a) {
      const text = new TextDecoder().decode(new Uint8Array(arrayBuffer, start, length)).replace(/\0+$/, '');
      json = JSON.parse(text);
    } else if (type === 0x004e4942) {
      binary = arrayBuffer.slice(start, start + length);
    }
    offset = start + length;
  }
  if (!json || !binary) throw new Error('Incomplete GLB');
  return { json, binary };
}

function accessorArray(gltf, binary, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const [reader, ArrayType, bytes] = COMPONENT_READERS[accessor.componentType];
  const itemSize = TYPE_SIZE[accessor.type];
  const stride = bufferView.byteStride || itemSize * bytes;
  const start = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const output = new ArrayType(accessor.count * itemSize);
  const view = new DataView(binary);
  for (let index = 0; index < accessor.count; index += 1) {
    const itemOffset = start + index * stride;
    for (let component = 0; component < itemSize; component += 1) {
      output[index * itemSize + component] = view[reader](itemOffset + component * bytes, true);
    }
  }
  return { array: output, itemSize, normalized: Boolean(accessor.normalized) };
}

function makeMaterial(THREE, material = {}) {
  const pbr = material.pbrMetallicRoughness || {};
  const factor = pbr.baseColorFactor || [1, 1, 1, 1];
  const color = new THREE.Color(factor[0], factor[1], factor[2]);
  const options = {
    color,
    roughness: pbr.roughnessFactor ?? 1,
    metalness: pbr.metallicFactor ?? 0,
    shading: THREE.FlatShading,
    transparent: factor[3] < 1 || material.alphaMode === 'BLEND',
    opacity: factor[3],
    side: material.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  };
  if (material.emissiveFactor) {
    options.emissive = new THREE.Color(...material.emissiveFactor);
  }
  const result = new THREE.MeshStandardMaterial(options);
  result.name = material.name || '';
  return result;
}

function makePrimitive(THREE, gltf, binary, primitive, materials) {
  const geometry = new THREE.BufferGeometry();
  const attributeMap = {
    POSITION: 'position',
    NORMAL: 'normal',
    TEXCOORD_0: 'uv',
    COLOR_0: 'color',
  };
  for (const [semantic, accessorIndex] of Object.entries(primitive.attributes || {})) {
    const name = attributeMap[semantic];
    if (!name) continue;
    const data = accessorArray(gltf, binary, accessorIndex);
    geometry.addAttribute(name, new THREE.BufferAttribute(data.array, data.itemSize, data.normalized));
  }
  if (primitive.indices != null) {
    const data = accessorArray(gltf, binary, primitive.indices);
    geometry.setIndex(new THREE.BufferAttribute(data.array, 1));
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, materials[primitive.material] || materials[0]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export async function loadPortableGlb(THREE, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Character GLB failed: ${response.status}`);
  const { json: gltf, binary } = parseGlb(await response.arrayBuffer());
  const materials = (gltf.materials || [{}]).map((material) => makeMaterial(THREE, material));
  const meshObjects = (gltf.meshes || []).map((mesh) => {
    const group = new THREE.Group();
    group.name = mesh.name || '';
    for (const primitive of mesh.primitives || []) {
      group.add(makePrimitive(THREE, gltf, binary, primitive, materials));
    }
    return group;
  });
  const nodes = (gltf.nodes || []).map((node) => {
    const object = new THREE.Group();
    object.name = node.name || '';
    object.userData = { ...(node.extras || {}) };
    if (node.translation) object.position.fromArray(node.translation);
    if (node.rotation) object.quaternion.fromArray(node.rotation);
    if (node.scale) object.scale.fromArray(node.scale);
    if (node.matrix) object.applyMatrix(new THREE.Matrix4().fromArray(node.matrix));
    if (node.mesh != null) object.add(meshObjects[node.mesh].clone());
    return object;
  });
  gltf.nodes.forEach((node, index) => {
    for (const childIndex of node.children || []) nodes[index].add(nodes[childIndex]);
  });
  const root = new THREE.Group();
  const sceneDef = gltf.scenes?.[gltf.scene || 0];
  for (const nodeIndex of sceneDef?.nodes || []) root.add(nodes[nodeIndex]);
  root.name = sceneDef?.name || 'character';
  return root;
}

