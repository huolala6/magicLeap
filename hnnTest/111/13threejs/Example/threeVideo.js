class v {
    init(){
        //加载文件
        /*let orbit = MeowGodThree.Util.createScript('Libs/Controls/OrbitControls.js');
        orbit.then(()=>{
            this.initRender();
        })*/
        this.initRender();
    }

    initRender(){
        console.log('init threeVideo')
        this.render = new THREE.WebGLRenderer({antialias:true});
        this.render.setPixelRatio(window.devicePixelRatio);
        this.render.setSize(window.innerWidth,window.innerHeight);
        this.render.setClearColor(0xeeeeee);
        //需要阴影效果
        this.render.shadowMap.enabled = true;
        MeowGodThree.wrapper.appendChild(this.render.domElement);
        //camera
        this.camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        this.camera.position.set(0,0,0);
        //scene
        this.scene = new THREE.Scene();
        //light
        this.scene.add(new THREE.AmbientLight(0x444444))
        this.light = new THREE.DirectionalLight(0xFFFFFF);
        this.light.position.set(0,20,20);
        this.light.castShadow = true;
        this.light.shadow.camera.top = 10;
        this.light.shadow.camera.bottom = -10;
        this.light.shadow.camera.left = -10;
        this.light.shadow.camera.right = 10;
        this.light.castShadow = true;
        this.scene.add(this.light);

        //辅助工具
        // let helper = new THREE.AxesHelper(50);
        // this.scene.add(helper);

        this.initModel();

        this.animate();

    }

    initModel(){
        //添加立方体
        let geometry = new THREE.BoxBufferGeometry(10,5,5);
        let video = this.addVideo();

        let texture = new THREE.VideoTexture(video);
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        let material = new THREE.MeshBasicMaterial( { map: texture } );
        this.box = new THREE.Mesh(geometry, material)
        this.scene.add(this.box);
        this.box.position.z = -20;
    }

    addVideo(){
       let threeVideo = document.createElement( 'video' );
        threeVideo.crossOrigin = 'anonymous';
        threeVideo.loop = true;
        threeVideo.preload = 'auto';
        threeVideo.autoplay = true;
        threeVideo.src = 'video/ar.mp4';
        threeVideo.setAttribute('x5-video-player-type','h5')
        threeVideo.setAttribute('playsinline','true')
        threeVideo.setAttribute('x5-playsinline','true')
        threeVideo.setAttribute('preload','auto')
        threeVideo.setAttribute('webkit-playsinline','true')
        threeVideo.setAttribute('x-webkit-airplay','true')
        return threeVideo;
    }

    animate(){
        if(MeowGodThree.Stats){
            MeowGodThree.Stats.update();
        }

//      this.box.rotation.x +=0.0009;
//      this.box.rotation.y +=0.0009;

        this.render.render(this.scene,this.camera);
        
        requestAnimationFrame(this.animate.bind(this))
    }

    onWindowResize() {
        MeowGodThree.threeVideo.camera.aspect = window.innerWidth / window.innerHeight;
        MeowGodThree.threeVideo.camera.updateProjectionMatrix();
        MeowGodThree.threeVideo.render.setSize(window.innerWidth, window.innerHeight);
    }
    
}

MeowGodThree.threeVideo = new v();