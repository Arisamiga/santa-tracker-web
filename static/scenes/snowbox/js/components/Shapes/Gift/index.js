import Obj from '../index.js'
import LoaderManager from '../../../managers/LoaderManager.js'

// Config
import GLOBAL_CONFIG from '../../Scene/config.js'
import CONFIG from './config.js'

class Gift extends Obj {
  constructor(scene, world, material) {
    // Physics
    super(scene, world)

    // Props
    this.material = material
    this.selectable = CONFIG.SELECTABLE
    this.mass = CONFIG.MASS
    this.size = CONFIG.SIZE
    this.name = CONFIG.NAME
    this.normalMap = CONFIG.NORMAL_MAP
    this.obj = CONFIG.OBJ
    this.mulipleMaterials = true
  }

  init() {
    const { obj } = LoaderManager.subjects[this.name]

    // Materials
    const defaultMaterial = new THREE.MeshToonMaterial({
      color: CONFIG.COLORS[0],
      shininess: GLOBAL_CONFIG.SHININESS,
    })
    defaultMaterial.needsUpdate = true

    const secondMaterial = new THREE.MeshToonMaterial({
      color: CONFIG.COLORS[1],
      shininess: GLOBAL_CONFIG.SHININESS,
    })

    for (let i = 0; i < obj.children.length; i++) {
      const geometry = obj.children[i].geometry

      let material
      if (i !== 4) {
        material = defaultMaterial
      } else {
        material = secondMaterial
      }

      this.geoMats.push({
        geometry,
        material,
      })
    }

    this.setShape(defaultMaterial)
  }

  createShapes(scale = 1) {
    const shape = new CANNON.Box(
      new CANNON.Vec3((CONFIG.SIZE / 2) * scale, (CONFIG.SIZE / 2) * scale, (CONFIG.SIZE / 2) * scale)
    )

    const offset = new CANNON.Vec3(-0.09 * scale, -0.015 * scale, 0.05 * scale)

    this.body.addShape(shape, offset)
  }
}

export default Gift