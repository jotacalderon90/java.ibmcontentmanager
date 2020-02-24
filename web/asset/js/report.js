var app = angular.module('myApp',[]);

app.factory("logger", jotaLogger);
app.factory("validator", jotaValidator);
app.factory("service",jotaService);
app.factory("transcend", jotaTranscend);

app.controller("myController", function(logger,validator,service,transcend,$scope){
	
	var self = this;
	
	self.logger = logger;
	self.service = new service();
	
	self.entity = new transcend({
		logger: logger, 
		scope:$scope,
		service: {
			getTotal: self.service.create("POST","/FullContentManager/api/rest/content-manager/PROD/total")
		},
		start: function(){
			
			this.entityName = entityId;
			
			this.years = [];
			this.months = [	{id:"00",label:"Todos los meses"},
		                 	{id:"01",label:"Enero"},{id:"02",label:"Febrero"},{id:"03",label:"Marzo"},{id:"04",label:"Abril"},
		                 	{id:"05",label:"Mayo"},{id:"06",label:"Junio"},{id:"07",label:"Julio"},{id:"08",label:"Agosto"},
		                 	{id:"09",label:"Septiembre"},{id:"10",label:"Octubre"},{id:"11",label:"Noviembre"},{id:"12",label:"Diciembre"}];
			
			this.date = new Date();
			this.year =  this.date.getFullYear();
			this.month = this.months[0];

			this.totalquery = 0;
			this.totalreport = 0;
			this.leyend = [];
			
			this.resume = {};
			
			for(var i=this.date.getFullYear();i>=2010;i--){
				this.years.push(i);
			}
		},
		postData: function(from,to){
			return JSON.stringify({
				entityname: this.entityName,
	    		filter: [{
	    			name: "SYSROOTATTRS.CREATETS", 
	    			value1: from.yyyymmdd(), 
	    			operation: "between", 
	    			value2: to.yyyymmdd()
	    		}]
			});
		},
		report: function(){
			if(this.month.id == "00"){
				this.reportAnual();
			}else{
				this.reportMensual();
			}
		},
		reportAnual: function(){

			this.totalquery = 0;
			this.totalreport = 0;
			this.resume = {};
			this.leyend = [{label: "Enero", y: 0, load: false},
			               {label: "Febrero", y: 0, load: false},
			               {label: "Marzo", y: 0, load: false},
			               {label: "Abril", y: 0, load: false},
			               {label: "Mayo", y: 0, load: false},
			               {label: "Junio", y: 0, load: false},
			               {label: "Julio", y: 0, load: false},
			               {label: "Agosto", y: 0, load: false},
			               {label: "Septiembre", y: 0, load: false},
			               {label: "Octubre", y: 0, load: false},
			               {label: "Noviembre", y: 0, load: false},
			               {label: "Diciembre", y: 0, load: false}];
			
			for(var i=0;i<12;i++){
				var from = new Date(this.year,i,1);
		    	var to = new Date(this.year,i+1,1);
		    	
		    	this.service.getTotal({},this.postData(from,to),{m:i,self:this},function(response,cli){
		    		try{
		    			var response = JSON.parse(response.responseText);
		    			cli.self.totalquery++;
		    			cli.self.totalreport+=response.total;
		    			cli.self.leyend[cli.m].y = response.total;
		    			cli.self.leyend[cli.m].load = true;
		    			
		    			cli.self.scope.$digest(function(){});
		    			
		    			if(cli.self.totalquery==12){
		    				cli.self.createReport(1,"Reporte anual", "column", cli.self.leyend,"MMM");
		    			}
		    		}catch(e){
		    			alert("Error al obtener datos del mes " + (cli.m + 1));
		    			console.log(e);
		    		}
		    	});
			}
			
		},
		reportMensual: function(){
			
			this.totalquery = 0;
			this.totalreport = 0;
			this.resume = {};
			this.leyend = [];
			
			var from = new Date(this.year,parseInt(this.month.id) - 1,1);
			var to = new Date(this.year,parseInt(this.month.id),1);
			to.setDate(0);
			
			this.scope.maxquery = to.getDate();
			
			for(var i=1;i<=to.getDate();i++){
				
				var f = new Date(this.year,parseInt(this.month.id)-1,i);
				var t = new Date(this.year,parseInt(this.month.id)-1,i);
		    	t.setDate(t.getDate() + 1);
		    	
		    	this.leyend.push({label: f.yyyymmdd(), y: 0, load: false});

		    	this.service.getTotal({},this.postData(f,t),{m:i,self:this},function(response,cli){
		    		try{
		    			var response = JSON.parse(response.responseText);
		    			cli.self.totalquery++;
		    			cli.self.totalreport+=response.total;
		    			cli.self.leyend[cli.m-1].y = response.total;
		    			cli.self.leyend[cli.m-1].load = true;
		    			
		    			cli.self.scope.$digest(function(){});
		    			
		    			if(cli.self.totalquery==cli.self.scope.maxquery){
		    				cli.self.createReport(2,"Reporte mensual","column", cli.self.leyend,"DD/MMM/YYYY");
		    			}
		    		}catch(e){
		    			alert("Error al obtener datos del dia " + cli.m);
		    			console.log(e);
		    		}
		    	});
			}
			
		},
		createReport: function(id,title,type,data,valueFormatString){
			var chart = new CanvasJS.Chart("chartContainer", {
				theme: "theme1",
				title:{
					text: title
				},
				animationEnabled: true,
				data: [
					{
						// Change type to "bar", "area", "spline", "pie",etc.
						type: type,
						dataPoints: data
					}
				]
			});
			chart.render();
			if(id=="1"){
				this.createResumeAnual(data);
			}else if(id=="2"){
				this.createResumeMensual(data);
			}
	    },
	    createResumeAnual: function(data){

	    	this.resume.media = this.totalreport / 12;
	    	this.resume.max = {label: "", total: 0 };
	    	this.resume.min = {label: "", total: 999999 };
	    	
	    	for(var i=0;i<data.length;i++){
	    		if(data[i].y > this.resume.max.total){
	    			this.resume.max.label = data[i].label;
	    			this.resume.max.total = data[i].y;
	    		}
	    		if(data[i].y < this.resume.min.total){
	    			this.resume.min.label = data[i].label;
	    			this.resume.min.total = data[i].y;
	    		}
	    	}
	    	
	    	this.resume.show = true;
	    	this.scope.$digest(function(){});
	    },
	    createResumeMensual: function(data){

	    	this.resume.media = this.totalreport / 12;
	    	this.resume.min = {label: "", total: 999999 };
	    	this.resume.max = {label: "", total: 0 };
	    	
	    	for(var i=0;i<data.length;i++){
	    		if(data[i].y < this.resume.min.total){
	    			this.resume.min.label = data[i].label;
	    			this.resume.min.total = data[i].y;
	    		}
	    		if(data[i].y > this.resume.max.total){
	    			this.resume.max.label = data[i].label;
	    			this.resume.max.total = data[i].y;
	    		}
	    	}
	    	
	    	this.resume.show = true;
	    	this.scope.$digest(function(){});
	    }
	});
	
});