$(document).ready(function(){
	
	//links inside page
	$("a").click(function(event){
		var href = $(this).attr("href");
		if(href!=undefined && href.indexOf("#")==0 && href.length>1){
			event.preventDefault();
			try{
				$("html,body").animate({scrollTop : $(href).offset().top},1000);
			}catch(e){
				console.log(e);
			}
		}
	});
	
	//tab in textarea
	$(document).delegate('textarea', 'keydown', function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode == 9) {
			e.preventDefault();
			var start = $(this).get(0).selectionStart;
			var end = $(this).get(0).selectionEnd;
			$(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));
			// put caret at right position again
			$(this).get(0).selectionStart = $(this).get(0).selectionEnd = start + 1;
		}
	});

	//prevent default
	$("body").delegate(".prevent-default", "click", function(event){
		event.preventDefault();
	});
	
	//Form whit autosubmit
	$(".formXhr").submit(function(event){
		event.preventDefault();																//evito el submit del formulario
		var form = $(this);																	//obtengo el objeto formulario
		form.find(".alert").addClass("hidden");												//oculto contenedor de mensajes
		var data = {};																		//defino el objeto data para enviar al servidor
		var alerts = [];																	//defino lista de alertas
		var inputs = form.find("input,select,textarea");									//obtengo lista de campos de entrada
		for(var i=0;i<inputs.length;i++){													//recorro lista de campos de entrada
			var input = inputs[i];															//	obtengo input en proceso
			data[input.getAttribute("name")] = input.value;									//	agrego atributo y valor del input a la data de envío
			if(input.hasAttribute("required") && input.value.trim()==""){					//	valido atributo required y valor del input
				alerts.push(input.getAttribute("data-error-msg"));							//		agrego mensaje de alerta
			}																				//	fin validacion
		}																					//fin recorrido
		if(alerts.length==0){																//valido cantidad de alertas
			$.ajax({																			//ejecuto ajax de jquery
				method : form.attr("method"),														//seteo el metodo del ajax con metodo del formulario
				url: form.attr("action"),															//seteo el destino del ajax con destino del formulario
				data: data																			//seteo la data a enviar
			}).done(function(data,textStatus,jqXHR){											//defino callback o metodo de retorno  satisfactorio con su parametro data de respuesta
				console.log(data);																	//imprimo respuesta en consola
				if(typeof data=="object"){															//valido que tipo de respuesta es un objeto
					form.find(".alert-success").removeClass("hidden");									//si todo esta ok muestro mensaje de exito
				}else{																				//defino accion para alertar
					form.find(".alert-danger").removeClass("hidden");									//muestro mensaje de error
				}																					//fin definicion de alertas
				for(var i =0;i<inputs.length;i++){													//recorro inputs
					input.value = (input.hasAttribute("data-static"))?input.value:"";					//limpio inputs
				}																					//fin recorrido de inputs
			});																				//fin de metodo callback de error
		}else{																				//defino accion para alertar
			form.find(".alert-warning").html(alerts.join("<br>")).removeClass("hidden");	//actualizo contenedor de alertas y muestro
		}
	});
	
});


/********/
/********/
//funciones externas

function parseXml(xml) {
	var dom = null;
	if(window.DOMParser){
		try {
			dom = (new DOMParser()).parseFromString(xml, "text/xml");
		}catch(e){
			dom = null;
		}
	}else if(window.ActiveXObject){
		try {
			dom = new ActiveXObject('Microsoft.XMLDOM');
			dom.async = false;
			if(!dom.loadXML(xml)){
				// parse error ..
				window.alert(dom.parseError.reason + dom.parseError.srcText);
			}
		}catch (e) {
			dom = null;
		}
	}else{
		alert("cannot parse xml string!");
	}
	return dom;
}

var fullscreen = function(e){
	if (e.webkitRequestFullScreen) {
		e.webkitRequestFullScreen();
	} else if(e.mozRequestFullScreen) {
		e.mozRequestFullScreen();
	}
}

//get position from div editable
var getCaretPosition = function(editableDiv) {
	var caretPos = 0,sel, range;
	if (window.getSelection) {
		sel = window.getSelection();
		if (sel.rangeCount) {
			range = sel.getRangeAt(0);
			if (range.commonAncestorContainer.parentNode == editableDiv) {
				caretPos = range.endOffset;
			}
		}
	}else if (document.selection && document.selection.createRange) {
		range = document.selection.createRange();
		if (range.parentElement() == editableDiv) {
			var tempEl = document.createElement("span");
			editableDiv.insertBefore(tempEl, editableDiv.firstChild);
			var tempRange = range.duplicate();
			tempRange.moveToElementText(tempEl);
			tempRange.setEndPoint("EndToEnd", range);
			caretPos = tempRange.text.length;
		}
	}
	return caretPos;
}

/********/
/********/
//mis funciones

var jotaValidator = function(){
	
	var self = function(){}
	
	self.prototype.validMail = function(data){
		var exp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(data!=undefined && data.trim()!="" && exp.test(data)){
			return true;
		}else{
			return false;
		}
	}
	
	return self;
}

var jotaLogger = function(){
	var self = {
		coll: [],
		push: function(message){
			self.coll.push({
				show: true, 
				spinner: true, 
				class: "alert-info", 
				msg: message, 
				err: null,
				success: function(scope){
					var self = this;
					setTimeout(function(){
						self.show = false;
						if(scope){scope.$digest(function(){});}
					},2000);
				}
			});
			return self.coll[self.coll.length-1];
		}
	}
	return self;
}

var jotaConvert = function(){
	var self = function(){}
	
	self.prototype.textToDom = function(textHtml){
		return $(textHtml);
	}

	self.prototype.domToArr = function(dom){
		var arr = [];
		for(var i=0;i<dom.length;i++){
			var node = dom[i];
			if(node.nodeType==1){
				
				var attrs = [];
				for(var x=0;x<node.attributes.length;x++){
					attrs.push({name: node.attributes[x].name,value: node.attributes[x].value});
				}
				
				var children = [];
				if(node.childNodes){
					children = this.domToArr(node.childNodes);
				}
				
				arr.push({type: "element",  name: node.nodeName, attributes: attrs, children: children});
			}else if(node.nodeType==3 && node.nodeValue.trim()!=""){
				arr.push({type: "textnode", name: "TextNode", value: node.nodeValue});
			}
		}
		return arr;
	}
	
	self.prototype.arrToTree = function(arr){
		var lis = [];
		for(var i=0;i<arr.length;i++){
			
			var li = document.createElement("li");
			var check = document.createElement("input");
			var label = document.createElement("label");
			var a = document.createElement("a");
			
			var id = Math.random();
			
			check.setAttribute("type", "checkbox");
			check.setAttribute("id", id);
			
			label.setAttribute("for", id);
			label.appendChild(document.createTextNode(arr[i].name));
			
			a.appendChild(document.createTextNode(arr[i].name));
			
			li.setAttribute("data-type", arr[i].type);
			li.setAttribute("data-name", arr[i].name.toLowerCase());
			li.setAttribute("data-attributes", JSON.stringify(arr[i].attributes));
			li.setAttribute("data-value", arr[i].value);
			
			if(arr[i].type=="textnode"){
				li.appendChild(a);
			}else{
				li.appendChild(check);
				li.appendChild(label);
				var ul = document.createElement("ul");
				var child = this.arrToTree(arr[i].children);
				for(var x=0;x<child.length;x++){
					ul.appendChild(child[x]);
				}
				li.appendChild(ul);
			}
			lis.push(li);
		}
		return lis;
	}
	
	self.prototype.treeToHTML = function(tree){
		var html = "";
		for(var i=0;i<tree.length;i++){
			var dom = tree[i];
			var type = dom.getAttribute("data-type");
			if(type=="element"){
				var varElement = dom.getAttribute("data-name");
				var varAttrs = JSON.parse(dom.getAttribute("data-attributes"));
				
				var attrs = "";
				for(var x=0;x<varAttrs.length;x++){
					attrs += varAttrs[x].name + "=\""+varAttrs[x].value+"\"";
				}
				
				var newhtml = "<**element** **attrs**>**children**</**element**>";
				
				newhtml = newhtml.split("**element**").join(varElement);
				newhtml = newhtml.replace("**attrs**", attrs);
				
				var ul = dom.getElementsByTagName("UL");
				if(ul.length > 0){
					newhtml = newhtml.replace("**children**", this.treeToHTML(ul[0].childNodes));
				}else{
					newhtml = newhtml.replace("**children**","");
				}
				html+=newhtml;
			}else if(type=="textnode"){
				html+=dom.getAttribute("data-value");
			}
		}
		return html;
	}
		
	return self;
}

var jotaService = function(){
	
	var self = function(){}
	
	self.prototype.create = function(METHOD,URL,HASBODY){
		
		var fncParams = function(METHOD){
			return function(params,cli,cb){
				self.prototype.execute(METHOD,self.prototype.URIBuild(URL,params),undefined,cb,cli);
			}
		}
		
		var fncBody = function(METHOD){
			return function(params,body,cli,cb){
				self.prototype.execute(METHOD,self.prototype.URIBuild(URL,params),body,cb,cli);
			}
		}
		
		if(METHOD=="GET" || METHOD=="DELETE"){
			return fncParams(METHOD);
		}else{
			HASBODY = (HASBODY==undefined)?true:HASBODY;
			return (HASBODY)?fncBody(METHOD):fncParams(METHOD);
		}
	}
	
	self.prototype.URIBuild = function(uri,params){
		for(var attr in params){
			uri = uri.replace(":"+attr,params[attr]);
		}
		return uri;
	}
	
	self.prototype.execute = function(method,url,body,callback,client){
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {if (xhttp.readyState == 4) {callback(xhttp,client);}};
		xhttp.open(method,url);
		if(body!=undefined){
			xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			xhttp.send(body);
		}else{
			xhttp.send();
		}
	}
	
	return self;
}

var jotaTranscend = function(){
	
	var self = function(data){
		this.doc = null;
		this.coll = [];
		
		this.newdoc = {};
		this.backrest = null;
		
		this.total = 0;
		this.obtained = 0;
		this.getFrom = 0;
		this.increase = false;
		this.action = null;
		this.subaction = null;
		this.totalpages = 0;
		this.rowsByPage = 10;
		this.pages = [];
		this.selectedPage = 0;
		this.message = {
			create: {on: "Creando documento", error: "Error al crear documento", success: "Documento creado correctamente"},
			read: {on: "Cargando documento", error: "Error al cargar documento", success: "Documento cargado correctamente"},
			update: {on: "Actualizando documento", error: "Error al actualizar el documento", success: "Documento actualizado correctamente"},
			delete: {on: "Eliminando documento", error: "Error al eliminar el documento", success: "Documento eliminado correctamente"},
			getCollection: {on: "Cargando documentos", error: "Error al cargar documentos", success: "Documentos cargados correctamente"},
			getTotal: {on: "Cargando total de documentos", error: "Error al obtener la cantidad de documentos", success: "Total de documentos cargados"},
		}
		this.service = null;
		this.logger = null;
		this.config = null;
		if(data){
			
			for(attr in data){
				this[attr] = data[attr];
			}
			
			if(this.start){this.start();}
		}
	}

	self.prototype.default = function(){
		return {};
	}
	
	self.prototype.new = function(){
		this.action = "new";
		this.newdoc = this.default();
	}
	
	self.prototype.changeMode = function(mode){
		this.action = mode;
	}

	self.prototype.isCreateMode = function(){
		return (this.action=="new")?true:false;
	}
	
	self.prototype.isReadMode = function(){
		return (this.action=="read")?true:false;
	}

	self.prototype.isEditMode = function(){
		return (this.action=="edit")?true:false;
	}
	
	self.prototype.select = function(doc){
		this.doc = doc;
		this.afterSelect(this.doc);
	}
	
	self.prototype.afterSelect = function(doc){
		
	}
	
	self.prototype.close = function(){
		this.doc = null;
		this.newdoc = {};
		this.action = null;
		this.subaction = null;
		this.afterClose();
	}
	
	self.prototype.afterClose = function(){
		
	}
	
	self.prototype.setRecovery = function(data){
		this.backrest = angular.copy(data);
	}
	
	self.prototype.recovery = function(){
		this.doc = angular.copy(this.backrest);
	}
	
	self.prototype.formatCollectionToClient = function(coll){
		for(var i=0;i<coll.length;i++){
			coll[i] = this.formatToClient(coll[i]);
		}
		return coll;
	}
	
	self.prototype.formatToClient = function(doc){
		return doc;
	}
	
	self.prototype.formatToServer = function(doc){
		return doc;
	}
	
	self.prototype.getQuerystring = function(){
		var str = "";
		
		var outstr = "";
		for(out in this.output){
			if(this.output[out]==true){
				outstr+=(outstr!="")?",":"";
				outstr+=out;
			}
		}
			
		if(outstr!=""){
			str+="output[fields]="+outstr;
		}
		
		var filterstr="";
		var filterval="";
		for(filter in this.filter){
			if(this.filter[filter]!=""){
				filterstr+=(filterstr!="")?",":"";
				filterstr+=filter;
				filterval+="&filter["+filter+"]="+this.filter[filter];
			}
		}
		
		if(filterstr!=""){
			str+="&filter[fields]="+filterstr+"&"+filterval;
		}
		
		return "?" + str;
	}
	
	/***********/
	/*GET TOTAL*/
	/***********/

	self.prototype.beforeGetTotal = function(){
		return true;
	}
	
	self.prototype.paramsToGetTotal = function(){
		return {querystring: this.getQuerystring()};
	}
	
	self.prototype.clientToGetTotal = function(){
		return {
			log: this.logger.push(this.message.getTotal.on),
			self: this
		}
	}

	self.prototype.getTotal = function(params){
		if(this.beforeGetTotal()){
			this.service.getTotal((params!=undefined)?params:this.paramsToGetTotal(),this.clientToGetTotal(),this.callbackGetTotal);
		}
	}
	
	self.prototype.callbackGetTotal = function(response,client){
		client.onSuccess = client.self.successGetTotal;
		client.onError = client.self.errorGetTotal;
		client.self.callback(response,client);
	}
	
	self.prototype.successGetTotal = function(response,client){
		client.log.msg = client.self.message.getTotal.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.total = (client.self.responseGetTotal)?client.self.getSubElement(response.data,client.self.responseGetTotal):response.data.data;
		client.self.setPages();
		client.self.afterGetTotal(response,client);
	}

	self.prototype.errorGetTotal = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.getTotal.error;
		//client.self.afterGetTotal(response,client);
	}
	
	self.prototype.afterGetTotal = function(response,client){
		
	}
	
	/****************/
	/*GET COLLECTION*/
	/****************/

	self.prototype.beforeGetCollection = function(){
		return true;
	}
	
	self.prototype.paramsToGetCollection = function(){
		return {from: this.obtained, querystring: this.getQuerystring()};
	}
	
	self.prototype.clientToGetCollection = function(){
		return {
			log: this.logger.push(this.message.getCollection.on),
			self: this
		}
	}
	
	self.prototype.getCollection = function(params){
		if(this.beforeGetCollection()){
			this.service.getCollection((params!=undefined)?params:this.paramsToGetCollection(),this.clientToGetCollection(),this.callbackGetCollection);
		}
	}
	
	self.prototype.callbackGetCollection = function(response,client){
		client.onSuccess = client.self.successGetCollection;
		client.onError = client.self.errorGetCollection;
		client.self.callback(response,client);
	}
	
	self.prototype.successGetCollection = function(response,client){
		client.log.msg = client.self.message.getCollection.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		var coll = client.self.formatCollectionToClient((client.self.responseGetCollection)?client.self.getSubElement(response.data,client.self.responseGetCollection):response.data);
		client.self.obtained+=coll.length;
		if(client.self.increase){
			client.self.coll = client.self.coll.concat(coll);
		}else{
			client.self.coll = coll;
		}
		client.self.afterGetCollection(response,client);
	}

	self.prototype.errorGetCollection = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.getCollection.error;
		//client.self.afterGetCollection(response,client);
	}
	
	self.prototype.afterGetCollection = function(response,client){
		
	}

	/********/
	/*CREATE*/
	/********/

	self.prototype.beforeCreate = function(doc){
		return true;
	}
	
	self.prototype.paramsToCreate = function(){
		return {};
	}
	
	self.prototype.clientToCreate = function(){
		return {
			log: this.logger.push(this.message.create.on),
			self: this
		}
	}
	
	self.prototype.create = function(){
		if(this.beforeCreate(this.newdoc)){
			this.service.create(this.paramsToCreate(),this.formatBody(this.formatToServer(this.newdoc)),this.clientToCreate(),this.callbackCreate);
		}
	}
	
	self.prototype.callbackCreate = function(response,client){
		client.onSuccess = client.self.successCreate;
		client.onError = client.self.errorCreate;
		client.self.callback(response,client);
	}
	
	self.prototype.errorCreate = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.create.error;
		//client.self.afterCreate(response,client);
	}

	self.prototype.successCreate = function(response,client){
		client.log.msg = client.self.message.create.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.close();
		client.self.afterCreate(response,client);
	}
	
	self.prototype.afterCreate = function(response,client){
		
	}
	
	/******/
	/*READ*/
	/******/

	self.prototype.beforeRead = function(){
		return true;
	}
	
	self.prototype.paramsToRead = function(){
		return {};
	}
	
	self.prototype.clientToRead = function(){
		return {
			log: this.logger.push(this.message.read.on),
			self: this
		}
	}
	
	self.prototype.read = function(params){
		if(this.beforeRead()){
			this.service.read((params!=undefined)?params:this.paramsToRead(),this.clientToRead(),this.callbackRead);
		}
	}
	
	self.prototype.callbackRead = function(response,client){
		client.onSuccess = client.self.successRead;
		client.onError = client.self.errorRead;
		client.self.callback(response,client);
	}
	
	self.prototype.errorRead = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.read.error;
		//client.self.afterRead(response,client);
	}

	self.prototype.successRead = function(response,client){
		client.log.msg = client.self.message.read.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.doc = client.self.formatToClient((client.self.responseRead)?client.self.getSubElement(response.data,client.self.responseRead):response.data);
		client.self.action = "read";
		client.self.afterRead(response,client);
	}
	
	self.prototype.afterRead = function(response,client){
		
	}

	/********/
	/*UPDATE*/
	/********/

	self.prototype.beforeUpdate = function(doc){
		return true;
	}
	
	self.prototype.paramsToUpdate = function(){
		return {};
	}
	
	self.prototype.clientToUpdate = function(){
		return {
			log: this.logger.push(this.message.update.on),
			self: this
		}
	}
	
	self.prototype.update = function(params){
		if(this.beforeUpdate(this.doc)){
			this.service.update((params!=undefined)?params:this.paramsToUpdate(),this.formatBody(this.formatToServer(this.doc)),this.clientToUpdate(),this.callbackToUpdate);
		}
	}
	
	self.prototype.callbackToUpdate = function(response,client){
		client.onSuccess = client.self.successUpdate;
		client.onError = client.self.errorUpdate;
		client.self.callback(response,client);
	}
	
	self.prototype.errorUpdate = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.update.error;
		//client.self.afterUpdate(response,client);
	}
	
	self.prototype.successUpdate = function(response,client){
		client.log.msg = client.self.message.update.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.close();
		client.self.afterUpdate(response,client);
	}

	self.prototype.afterUpdate = function(response,client){
		
	}

	/********/
	/*DELETE*/
	/********/

	self.prototype.beforeDelete = function(doc){
		return true;
	}
	
	self.prototype.paramsToDelete = function(){
		return {};
	}
	
	self.prototype.clientToDelete = function(){
		return {
			log: this.logger.push(this.message.delete.on),
			self: this
		};
	}
	
	self.prototype.delete = function(params){
		if(this.beforeDelete(this.doc)){
			this.service.delete((params!=undefined)?params:this.paramsToDelete(),this.clientToDelete(),this.callbackDelete);
		}
	}
	
	self.prototype.deleteById = function(id){
		this.service.delete({id: id},this.clientToDelete(),this.callbackDelete);
	}
	
	self.prototype.callbackDelete = function(response,client){
		client.onSuccess = client.self.successDelete;
		client.onError = client.self.errorDelete;
		client.self.callback(response,client);
	}
	
	self.prototype.errorDelete = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.delete.error;
		//client.self.afterDelete(response,client);
	}
	
	self.prototype.successDelete = function(response,client){
		client.log.msg = client.self.message.delete.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.close();
		client.self.afterDelete(response,client);
	}

	self.prototype.afterDelete = function(response,client){
		
	}

	/********/
	/*CONFIG*/
	/********/
	
	self.prototype.getConfig = function(){
		if(this.service.config){
			this.service.config({},{self: this},function(response,client){
				try{
					if(response.status==200){
						client.self.config = JSON.parse(response.responseText);
						client.self.afterGetConfig(null,client.self.config);
					}else{
						client.self.afterGetConfig(response,null);
					}
				}catch(e){
					client.self.afterGetConfig(e,null);
				}
			});
		}
	}
	
	self.prototype.afterGetConfig = function(err,config){
		if(err==null){
			this.afterGetConfigSuccess(this.config);
		}else{
			this.afterGetConfigError(err);
		}
	}
	
	self.prototype.afterGetConfigSuccess = function(config){
		
	}
	
	self.prototype.afterGetConfigError = function(err){
		alert("Error al obtener documento de configuración");
		console.log(err);
	}
	
	self.prototype.refreshFormulas = function(ROW){
		for(input in this.config.form){
			if(this.config.form[input].formula){
				try{
					ROW[input] = eval(this.config.form[input].formula);
				}catch(e){
					ROW[input] = e.toString();
				}
			}
		}
	}
	
	/***********/
	/*PAGINATOR*/
	/***********/
	
	self.prototype.setPages = function(){
		this.totalpages = Math.ceil(this.total / this.rowsByPage);
		this.pages = [];
		for(var i=1;i<=this.totalpages;i++){
			this.pages.push(i);
		}
		this.selectedPage = 1;
	}
	
	self.prototype.gotoFirstPage = function(){
		this.getFrom = (1*this.rowsByPage) - this.rowsByPage;
		this.getCollection();
		this.selectedPage = 1;
	}
	
	self.prototype.gotoPage = function(page){
		this.getFrom = (page*this.rowsByPage) - this.rowsByPage;
		this.getCollection();
		this.selectedPage = page;
	}
	
	self.prototype.gotoLastPage = function(){
		this.getFrom = (this.pages[this.pages.length-1]*this.rowsByPage)-this.rowsByPage;
		this.getCollection();
		this.selectedPage = this.pages.length;
	}
	
	self.prototype.isSelected = function(page){
		return (page==this.selectedPage)?"active":"";
	}
	
	self.prototype.getPages = function(){
		if(this.pages.length <= 10){
			return this.pages;
		}else{
			if(this.selectedPage<=5){
				return this.pages.slice(0,10);
			}else{
				return this.pages.slice(this.selectedPage-5,this.selectedPage-5+10);
			}
		}
	 }
	
	/********/
	/*OTHERS*/
	/********/
	
	self.prototype.callback = function(response,client){
		client.log.spinner = false;
		if(response.status!=200){
			client.log.err = {type: "HTTP", status: response.status, msg: response.responseText};
			client.onError(response,client);
		}else{
			try{
				response.data = JSON.parse(response.responseText)
				if(response.data.status=="ERROR"){
					client.log.err = {type: "APLICACION", status: 200, desc: response.data.desc};
					client.onError(response,client);
				}else{
					client.onSuccess(response,client);
				}
			}catch(e){
				console.log(e);
				client.log.err = {type: "SERVIDOR", status: response.status, msg: response.responseText};
				client.onError(response,client);
			}finally{
				if(client.self.scope!=undefined){
					client.self.scope.$digest(function(){});
				}
			}
		}
	}
	
	self.prototype.appendChild = function(item,subitem){
		item.push(subitem);
	}
	
	self.prototype.removeChild = function(item,index){
		item.splice(index,1);
	}
	
	self.prototype.formatBody = function(data){
		return JSON.stringify(data);
	}
	
	self.prototype.getSubElement = function(obj,subObj){
		var sub = subObj.split(".");
		var res = obj;
		for(var i=0;i<sub.length;i++){
			res = res[sub[i]];
		}
		return res;
	}
	
	self.prototype.validContent = function(doc,fields,callback){
		
		callback = (callback!=undefined)?callback:function(field){
			alert("El campo " + field + " no puede estar vacío");
		};
		
		for(var i=0;i<fields.length;i++){
			if(doc[fields[i]]==undefined || doc[fields[i]].trim()==""){
				callback(fields[i]);
				return false;
			}
		}
		return true;
	}
	
	return self;
	
};

//Funciones Nativas Javascript
Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth()+1).toString();
	var dd  = this.getDate().toString();
	return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
};