import * as THREE from 'three'
import Signals from 'signals'
// import OrbitControls from 'three-orbitcontrols'

export class InitEdit {
    constructor(el){
        let oEl=el || document.body
        let w=oEl.offsetWidth
        let h=oEl.offsetHeight

        //添加射线代码
        this.mouseVector=new THREE.Vector3()//鼠标xyz的坐标
        this.raycaster=new THREE.Raycaster()//射线对象
        this.tags=[]
        this.raycasterCubeMesh=null
        this.activePoint=null

        this.initSignalsObject()
        this.initEnvironment(oEl,w,h)
        // this.initGeometry()
        this.initOrbitControl()
        // this.loadModel()
        this.loadGLTFmodel()
        // this.onMouseMove()
        // this.onMouseDown()
        this.initAnimation()

        this.globalRAF()



    }
    //注册事件监听
    initSignalsObject(){
        this.Signals={
            requestAnimationFrame:new Signals(),
            windowResize:new Signals()
        }
    }
    initEnvironment(el,w,h){
        this.camera=new THREE.PerspectiveCamera(45,w/h,1,2000);
        this.camera.position.set(100, 200, 500);

        this.scene=new THREE.Scene();
        this.scene.background = new THREE.Color(0xa0a0a0);
        this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);
        this.group=new THREE.Group();

        this.tagObject=new THREE.Object3D()
        this.scene.add(this.tagObject)
        //light
        let light = new THREE.HemisphereLight(0xffffff, 0x444444);
        light.position.set(0, 200, 0);
        this.scene.add(light);

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 200, 100);
        light.castShadow = true;
        light.shadow.camera.top = 180;
        light.shadow.camera.bottom = -100;
        light.shadow.camera.left = -120;
        light.shadow.camera.right = 120;
        this.scene.add(light);
        // ground
        let groundMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({
            color: 0x999999,
            depthWrite: false
        }));
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
        //网格
        let grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);
        //辅助线
        this.scene.add(new THREE.AxesHelper(2000)); //场景坐标点
        // this.scene.add(new THREE.CameraHelper(light.shadow.camera))//相机阴影
        //renderer
        this.renderer=new THREE.WebGLRenderer({antialias:true})
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(w,h)
        this.renderer.shadowMap.enabled=true
        el.appendChild(this.renderer.domElement)

    }
    initGeometry(){
        let circleMesh=new THREE.Mesh(new THREE.SphereGeometry(10,32,32),new THREE.MeshBasicMaterial({color:0x00ff00}))
        this.group.add(circleMesh)
        this.scene.add(this.group)
    }
    loadfbxModel(){
        let mixers=[]
        let __group=this.scene
        // let THREE=require('three')
        let FBXLoader=require('three-fbx-loader')
        let loader = new FBXLoader()
        console.log('1',this)
        loader.load('https://threejs.org/examples/models/fbx/Samba Dancing.fbx', function(object) {
        // loader.load('https://www.banggemang.com/Models/fbx/SambaDancing.fbx', function(object) {
        // loader.load('@/model/fbxDance/Samba Dancing.fbx', function(object) {
        //     object.mixer = new THREE.AnimationMixer(object);
        //     mixers.push(object.mixer);
        //     let action = object.mixer.clipAction(object.animations[0]);
        //     action.play();
        //     object.traverse(function(child) {
        //         if(child.isMesh) {
        //             child.castShadow = true;
        //             child.receiveShadow = true;
        //         }
        //     });
            __group.add(object)
            console.log('2',__group)
            // rotationSet(object)
            console.log('fbx',object)

        });
        // this.scene.add(__group)
    }
    loadGLTFmodel(){
        let __this=this
        let GLTFLoader=require('three-gltf-loader')
        let loader=new GLTFLoader()
        loader.load('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',function(gltf){
            gltf.scene.scale.set(50,50,50)
            __this.scene.add(gltf.scene)
        })
    }

    onWindowResize(){
        this.Signals.windowResize.add(()=>{
            this.camera.aspect=window.innerWidth/window.innerHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(window.innerWidth,window.innerHeight)
        })
    }

    initOrbitControl(){
        this.orbitControls=new THREE.OrbitControls(this.camera,this.renderer.domElement)
        // this.orbitControls.enableDamping=true//是否有惯性
        // this.orbitControls.enableZoom=true//是否縮放
        // this.orbitControls.minDistance=10
        // this.orbitControls.maxDistance=4000
        this.orbitControls.update()
    }


    initAnimation(){
        this.Signals.requestAnimationFrame.add(()=>{
            if (this.orbitControls){
                this.orbitControls.update()
            }
            // this.tags.forEach(function (this.tagMesh) {
            //     this.tagMesh.updateTag()
            // })
            this.renderer.render(this.scene,this.camera)
        })
        // requestAnimationFrame(this.initAnimation.bind(this))
        // this.renderer.render(this.scene,this.camera)
    }
    //绑定全局的帧动画
    globalRAF(){
        this.Signals.requestAnimationFrame.dispatch()
        requestAnimationFrame(this.globalRAF.bind(this))
    }
    //绑定全局的resize监听事件，所有想调用的地方都可以调用
    globalWindowResize(){
        this.Signals.windowResize.dispatch()
    }


}