var httpFunctions = {
	http:{},
	//set http
	setHttp:function(http){
		this.http = http;
	},
	//generic method for http request
	call:function(uri,data,onSuccess,onError){
		this.http.post("private/api/" + uri,data)
		.success(function(data){onSuccess(data);})
		.error(function(data){onError(data);});
	},
	//on success this method valid response
	validSuccess:function(data,log){
		if(typeof(data)==="object"){
			log.response.status = data.status;
			log.response.desc = data.desc;
			log.response.det = data.det;
			return true;
		}else{
		    return false;
	    }
	},
	//on error always ejecute this action
	onError:function(data){
	   	alert("ERROR HTTP!");
	   	console.log(data);
	},
	//generic method to call from client methods
	getData:function(method,conf,callback,log){
		var vthis = this;
		this.call(method,conf,
			function(data){
				log.process=false;
				if(vthis.validSuccess(data,log)){
					if(data.status=="success"){
						callback(data);
					}
				}
			},this.onError
		);
	}
};