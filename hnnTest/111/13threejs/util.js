class t {

     //分解url
     parseUrl(){
        let url = location.href;
        return new Promise((resolve,reject)=>{
            let obj = {};
            let query = url.split("?")[1];
            if(!query){reject()}
            let queryArr = query.split("&");
            queryArr.find((item)=>{
                let value = item.split("=")[1];
                let key = item.split("=")[0];
                obj[key] = value;
            })
            resolve(obj)
        })
    }

    //动态创建script
    createScript(link){
        return new Promise((resolve,reject)=>{
            let r = document.createElement('script');
            r.type = 'text/javascript';
            r.src = link;
            r.onload = ()=>{
                resolve()
            }
            document.body.appendChild(r)
        })
    }



}

MeowGodThree.Util = new t();