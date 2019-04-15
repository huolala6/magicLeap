class api {

    constructor(){
        //存放wrapper
        MeowGodThree.wrapper = document.getElementById('wrapper');
        //检测url
        MeowGodThree.Util.parseUrl().then(suc=>{
            this.init(suc)
        }).catch(()=>{
            this.initDefaultApp();
        })
    }

    initDefaultApp(){

        
    }

   
    //初始化判断加载什么control等
    init(info){
        //加载state
        if(info.stats==='true'){
            MeowGodThree.Util
            .createScript('Libs/stats.min.js')
            .then(()=>{
                MeowGodThree.Stats = new Stats();
                document.body.appendChild(MeowGodThree.Stats.dom);
            });
        }    
        //加载demo
        if(info.type === 'threeVideo'){
            MeowGodThree.Util
                .createScript('Example/threeVideo.js')
                .then(()=>{
                    MeowGodThree.threeVideo.init();
                });
        };

        //制作一个Magic Leep的效果
        this.updateWrapper();
        
        window.addEventListener('resize',this.onWindowResize.bind(this),false)
        
        window.addEventListener('scroll',this.onWindowScroll.bind(this),false)

    }

    updateWrapper(){
        MeowGodThree.wrapper.style.height = window.innerHeight*3+'px';

        this.onWindowScroll();
    }

    onWindowResize(){
        this.updateWrapper();
        //某个模型的resize
        if(MeowGodThree.threeVideo){
            MeowGodThree.threeVideo.onWindowResize();
        }
    }

    onWindowScroll(){
        let max = window.innerHeight*3;
        let b = 5;
        let top = document.documentElement.scrollTop || window.pageYOffset;
        let s = 3*b*top/max;
        if(MeowGodThree.threeVideo){
            MeowGodThree.threeVideo.camera.position.z = s*b;
        }
    }

}

const ThreeApp = new api();