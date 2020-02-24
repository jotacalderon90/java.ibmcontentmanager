angular.module('angularApp', ['angularTreeview', 'file-model']).controller('mainController', function ($scope, $http) {

    //this controller
    var main = this;

    //define data for application
    main.data = {
        //Principal data
        connections: [], //connections to content manager
        itemtype: {}, //item type selected
        schema: [], //schema from item type selected
        rows: [], //rows from item type selected,

        //Second data
        others: {
            //form to add new connection
            newconnection: {
                name: "",
                server: "",
                user: "",
                pwd: "",
                schema: "",
                envpath: "",
                srvspath: ""
            },
            //for log request
            logs: [],
            //paginator
            paginator: {
                totalrows: 0,
                totalrowsbypage: 10,
                maxvisiblepages: 9,
                totalpages: 0,
                pages: [],
                currentpage: 1
            },
            //graphic
            graphic: {
                //for select options
                years: getYearsForFilter(),
                months: getMonths(),
                fields: [],
                //for select value
                year: "",
                month: "",
                field: "",
                //for request
                request: {request: 0, totalrequest: 0, totalrow: 0, searchbyyear: false, data: []}
                //for request year
            },
            //componentid for upload/update/delete
            componentid: "",
            formmetadata: {
                insert: true//false=update
            },
            //export property files
            export: {
                file: {
                    type: null,
                    master: null,
                    slave: null,
                    itemtype: null,
                    field: null,
                }
            }
        }
    }

    //Client methods
    main.methods = {
        /*************************/
        /*Generate new connection*/
        /*************************/

        //clean new connection
        cleanNewConnection: function () {
            main.data.others.newconnection = {name: "", server: "", user: "", pwd: "", schema: "", envpath: "", srvspath: ""};
        },
        //valid new connection
        validFormConnection: function () {
            var form = main.data.others.newconnection;
            if (form.name != "" && form.server != "" && form.user != "" && form.pwd != "" && form.schema != "" && form.envpath != "" && form.srvspath != "") {
                return true;
            } else {
                return false;
            }
        },
        //get new connections
        getConnection: function (main) {
            if (this.validFormConnection()) {
                var log = this.addLog("Conectando a nuevo servidor");
                this.httpfunctions.getData("itemtypes", main.data.others.newconnection, this.addConnection, log);
            }
        },
        //get entities from new connection
        addConnection: function (data) {
            var newconnection = {
                conf: main.data.others.newconnection,
                entities: data.data
            };
            for (var i = 0; i < newconnection.entities.length; i++) {
                newconnection.entities[i].conf = newconnection.entities[i];
                newconnection.entities[i].isEntity = true;
                newconnection.entities[i].parent = main.data.others.newconnection;
            }
            main.data.connections.push(newconnection);
            main.methods.cleanNewConnection();
        },
        //load connections
        openloadConnections: function () {
            $scope.modal = "loadconnections";
        },
        //load connections from txt
        loadConnections: function () {
            //clean connections
            main.data.connections = [];
            $scope.connections = [];

            try {
                var connections = JSON.parse($scope.txLoadconnections);
                for (var i = 0; i < connections.servers.length; i++) {
                    var data = connections.servers[i];
                    var connection = {
                        name: data.name,
                        server: data.server,
                        user: data.user,
                        pwd: data.pwd,
                        schema: data.schema,
                        envpath: data.envpath,
                        srvspath: data.srvspath,
                        other: i
                    };
                    $scope.connections.push(connection);
                    var log = this.addLog("Conectando a servidor de " + data.name);
                    this.httpfunctions.getData("itemtypes", connection, this.addConnectionFromTX, log);
                }
            } catch (e) {
                alert(e);
            }
        },
        addConnectionFromTX: function (data) {
            var newconnection = {
                conf: $scope.connections[data.other],
                entities: data.data
            };
            for (var i = 0; i < newconnection.entities.length; i++) {
                newconnection.entities[i].conf = newconnection.entities[i];
                newconnection.entities[i].isEntity = true;
                newconnection.entities[i].parent = $scope.connections[data.other];
            }
            main.data.connections.push(newconnection);
        },
        /******************/
        /*Select item type*/
        /******************/

        //clean schema
        cleanSchema: function () {
            main.data.schema = [];
            $scope.schema_loaded = false;
        },
        //select item type from outline connections
        selectItemType: function () {
            $scope.log_entityselected = "";
            if ($scope.currentNode == undefined || !$scope.currentNode.isEntity) {
                $scope.log_entityselected = "Debe seleccionar una entidad v\u00E1lida";
            } else {
                main.data.itemtype = $scope.currentNode;

                var postdata = main.data.itemtype.parent;
                postdata.itemtype = main.data.itemtype.id;

                this.cleanSchema();
                var log = this.addLog("Obteniendo esquema");
                this.httpfunctions.getData("schema", postdata, this.getSchema, log);

            }
        },
        //get schema post called http api
        getSchema: function (data) {
            $scope.schema_loaded = true;
            main.data.others.graphic.fields = [];
            main.data.schema = data.data;
            for (var i = 0; i < main.data.schema.length; i++) {
                main.data.schema[i].getting = (main.data.schema[i].name == "COMPONENTID" || main.data.schema[i].name == "SYSROOTATTRS.CREATETS") ? true : false;
                main.data.schema[i].filtering = false;
                if (main.data.schema[i].type == "7" || main.data.schema[i].type == "9") {
                    main.data.others.graphic.fields.push(main.data.schema[i]);
                    if (main.data.schema[i].name == "SYSROOTATTRS.CREATETS") {
                        main.data.others.graphic.field = main.data.schema[i];
                    }
                }
            }
            main.methods.setGraphicOptions();
            main.methods.getTotal();
        },
        /*****************/
        /*For filter data*/
        /*****************/

        //is filtering
        isFiltering: function () {
            for (var i = 0; i < main.data.schema.length; i++) {
                if (main.data.schema[i].filtering) {
                    return true;
                }
            }
            return false;
        },
        //field type
        getFieldType: function (type) {
            switch (parseInt(type)) {
                case 3:
                    return "number";
                    break;
                case 7:
                    return "date";
                    break;
                case 9:
                    return "datetime";
                    break;
                default:
                    return "text";
                    break;
            }
        },
        //get filters
        getFilters: function () {
            var filters = [];
            for (var i = 0; i < main.data.schema.length; i++) {
                var field = main.data.schema[i];
                if (field.filtering) {
                    filters.push({
                        name: field.name,
                        operation: field.operator,
                        value1: field.value1,
                        value2: (field.value2) ? field.value2 : ""
                    });
                }
            }
            return filters;
        },
        /**************/
        /*For get data*/
        /**************/

        //get total rows
        getTotal: function () {
            var postdata = main.data.itemtype.parent;
            postdata.itemtype = main.data.itemtype.id;
            postdata.filters = this.getFilters();
            var log = this.addLog("Obteniendo total de registros");
            this.httpfunctions.getData("total", postdata, main.methods.postGetTotal, log);
        },
        //post get total
        postGetTotal: function (data) {
            main.data.others.paginator.totalrows = data.data;
            main.methods.setPaginador();
        },
        //get output fields
        getOutput: function () {
            var output = [];
            for (var i = 0; i < main.data.schema.length; i++) {
                var field = main.data.schema[i];
                if (field.getting) {
                    output.push(field.name);
                }
            }
            return output;
        },
        //get data page
        getData: function (from) {
            var postdata = main.data.itemtype.parent;
            postdata.itemtype = main.data.itemtype.id;
            postdata.filters = this.getFilters();
            postdata.output = this.getOutput();
            postdata.fieldsort = ($scope.txFieldSort == undefined) ? "" : $scope.txFieldSort.name;
            postdata.sort = $scope.txTypeSort;
            postdata.preview = ($scope.txPreview) ? $scope.txPreview : false;
            postdata.from = from;
            $scope.export = (from == 0) ? true : false;
            var log = this.addLog("Obteniendo registros");
            this.httpfunctions.getData("data", postdata, main.methods.postGetData, log);
        },
        //post get data
        postGetData: function (data) {
            if ($scope.export) {
                main.methods.export(data, "data");
            } else {
                main.data.rows = data.data.data;
            }
        },
        //click in file
        clickFile: function (url) {
            $scope.modal = "filedocument";
            $scope.filedocument = url;
        },
        /***************/
        /*For paginator*/
        /***************/

        //set paginator
        setPaginador: function () {
            main.data.others.paginator.totalpages = Math.ceil(main.data.others.paginator.totalrows / main.data.others.paginator.totalrowsbypage);
            main.data.others.paginator.pages = [];
            for (var i = 1; i <= main.data.others.paginator.totalpages; i++) {
                main.data.others.paginator.pages.push({"indice": i});
            }
            this.setPage(1);
        },
        //get visual paginator
        getPaginador: function () {
            var desde;
            var hasta;
            if (main.data.others.paginator.totalpages <= main.data.others.paginator.maxvisiblepages) {
                desde = 1;
                hasta = main.data.others.paginator.totalpages;
            } else {
                var middle = Math.round(main.data.others.paginator.maxvisiblepages / 2);
                var range = middle - 1;
                if (main.data.others.paginator.currentpage <= middle) {
                    desde = 1;
                    hasta = main.data.others.paginator.maxvisiblepages;
                } else {
                    if (main.data.others.paginator.currentpage === main.data.others.paginator.totalpages) {
                        desde = main.data.others.paginator.currentpage - range;
                        hasta = main.data.others.paginator.currentpage;
                    } else {
                        desde = main.data.others.paginator.currentpage - range;
                        hasta = main.data.others.paginator.currentpage + range;
                        if (hasta > main.data.others.paginator.totalpages) {
                            hasta = main.data.others.paginator.totalpages;
                        }
                    }
                }
            }
            return main.data.others.paginator.pages.slice(desde - 1, hasta);
        },
        //set page
        setPage: function (page) {
            main.data.others.paginator.currentpage = page;
            var desde = ((main.data.others.paginator.currentpage * main.data.others.paginator.totalrowsbypage) - main.data.others.paginator.totalrowsbypage) + 1;
            this.getData(desde);
        },
        //show ini page
        showIniPage: function () {
            if (main.data.others.paginator.totalpages <= main.data.others.paginator.maxvisiblepages) {
                return false;
            } else {
                return (main.data.others.paginator.currentpage - (main.data.others.paginator.maxvisiblepages / 2) > 1) ? true : false;
            }
        },
        //show last page
        showLastPage: function () {
            if (main.data.others.paginator.totalpages <= main.data.others.paginator.maxvisiblepages) {
                return false;
            } else {
                return (main.data.others.paginator.currentpage + (main.data.others.paginator.maxvisiblepages / 2) < main.data.others.paginator.totalpages) ? true : false;
            }
        },
        //get current page
        getCurrentPage: function (page) {
            return (page === main.data.others.paginator.currentpage) ? "active" : "";
        },
        /***************/
        /*For graphic*/
        /***************/

        //set graphic options
        setGraphicOptions: function () {
            main.data.others.graphic.year = (new Date()).getFullYear().toString();
            main.data.others.graphic.month = {id: "00"};
            //main.data.others.graphic.field is set on load schema
            this.loadGraphic();
        },
        //load graphic
        loadGraphic: function () {
            main.data.others.graphic.request = {
                request: 0,
                totalrequest: 0,
                totalrow: 0,
                searchbyyear: false,
                data: []
            }
            if (main.data.others.graphic.month.id == "00") {
                this.loadGraphicYear();
            } else {
                this.loadGraphicMonth();
            }
        },
        //load graphic by year
        loadGraphicYear: function () {
            main.data.others.graphic.request.searchbyyear = true;
            main.data.others.graphic.request.request = 0;
            main.data.others.graphic.request.totalrequest = 12;

            for (var i = 0; i <= 11; i++) {
                var firstDate = new Date(main.data.others.graphic.year, i, 1);
                var lastDate = new Date(main.data.others.graphic.year, i + 1, 1);

                var log = this.addLog("Obteniendo el total de registros para cargar grafico (" + (i + 1) + "/12)");
                this.httpfunctions.getData("total",
                        {
                            server: main.data.itemtype.parent.server,
                            user: main.data.itemtype.parent.user,
                            pwd: main.data.itemtype.parent.pwd,
                            schema: main.data.itemtype.parent.schema,
                            envpath: main.data.itemtype.parent.envpath,
                            srvspath: main.data.itemtype.parent.srvspath,
                            itemtype: main.data.itemtype.parent.itemtype,
                            filters: [{
                                    name: main.data.others.graphic.field.name,
                                    value1: firstDate.yyyymmdd(),
                                    operation: "between",
                                    value2: lastDate.yyyymmdd()
                                }],
                            other: i + 1
                        }
                , function (data) {
                    main.data.others.graphic.request.request++;
                    main.data.others.graphic.request.totalrow += data.data;
                    main.data.others.graphic.months[data.other].total = data.data;
                    if (main.data.others.graphic.request.request == main.data.others.graphic.request.totalrequest) {
                        for (var i = 0; i < 12; i++) {
                            main.data.others.graphic.request.data.push({x: new Date(main.data.others.graphic.year, i, 1), y: main.data.others.graphic.months[i + 1].total});
                        }
                        main.methods.composeGraphic(main.data.others.graphic.request.data, "MMM");
                    }
                }, log);
            }
        },
        //load graphic by year
        loadGraphicMonth: function () {

            //Get last day from month selected
            var month = parseInt(main.data.others.graphic.month.id) - 1;
            var firstdate = new Date(main.data.others.graphic.year, month, 1);
            var lastdate = new Date(main.data.others.graphic.year, month + 1, 0);

            main.data.others.graphic.request.searchbyyear = false;
            main.data.others.graphic.request.request = 0;
            main.data.others.graphic.request.totalrequest = lastdate.getDate();

            //get data from days in month
            for (var i = 1; i <= main.data.others.graphic.request.totalrequest; i++) {
                var firstDate = new Date(main.data.others.graphic.year, month, i);
                var lastDate = new Date(main.data.others.graphic.year, month, i + 1);

                var log = this.addLog("Obteniendo el total de registros para cargar grafico (" + (i) + "/" + main.data.others.graphic.request.totalrequest + ")");
                this.httpfunctions.getData("total",
                        {
                            server: main.data.itemtype.parent.server,
                            user: main.data.itemtype.parent.user,
                            pwd: main.data.itemtype.parent.pwd,
                            schema: main.data.itemtype.parent.schema,
                            envpath: main.data.itemtype.parent.envpath,
                            srvspath: main.data.itemtype.parent.srvspath,
                            itemtype: main.data.itemtype.parent.itemtype,
                            filters: [{
                                    name: main.data.others.graphic.field.name,
                                    value1: firstDate.yyyymmdd(),
                                    operation: "between",
                                    value2: lastDate.yyyymmdd()
                                }],
                            other: i
                        }
                , function (data) {
                    main.data.others.graphic.request.request++;
                    main.data.others.graphic.request.totalrow += data.data;

                    main.data.others.graphic.request.data.push({
                        x: new Date(main.data.others.graphic.year, month, parseInt(data.other)),
                        y: data.data,
                        day: parseInt(data.other)
                    });

                    if (main.data.others.graphic.request.request == main.data.others.graphic.request.totalrequest) {
                        main.data.others.graphic.request.data.sort(function (a, b) {
                            return a.day - b.day
                        })
                        main.methods.composeGraphic(main.data.others.graphic.request.data, "DD/MMM/YYYY");
                    }
                }, log);
            }
        },
        //Compose graphic
        composeGraphic: function (options, valueFormatString) {
            var chart = new CanvasJS.Chart("chartContainer", {
                animationEnabled: true,
                //exportEnabled: true,
                toolTip: {
                    shared: true
                },
                axisX: {
                    labelFontSize: 10,
                    titleFontSize: 15,
                    gridColor: "Silver",
                    tickColor: "silver",
                    valueFormatString: valueFormatString
                },
                axisY: {
                    gridColor: "Silver",
                    tickColor: "silver",
                    labelFontSize: 10,
                    titleFontSize: 15
                },
                legend: {
                    verticalAlign: "center",
                    horizontalAlign: "right"
                },
                data: [{
                        type: "line",
                        showInLegend: true,
                        lineThickness: 2,
                        name: "Documentos publicados",
                        markerType: "square",
                        color: "#F08080",
                        dataPoints: options
                    }],
                legend: {
                    cursor: "pointer",
                    itemclick: function (e) {
                        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                            e.dataSeries.visible = false;
                        } else {
                            e.dataSeries.visible = true;
                        }
                        chart.render();
                    }
                }
            });
            chart.render();
        },
        //Get detail from canvasJs
        composeDetail: function (date) {
            if (main.data.others.graphic.request.searchbyyear) {
                return main.data.others.graphic.months[date.getMonth() + 1].label;
            } else {
                return date.yyyymmdd();
            }
        },
        /***************/
        /*CRUDS Methods*/
        /***************/

        //delete document
        deleteRow: function () {
            var postdata = {
                server: main.data.itemtype.parent.server,
                user: main.data.itemtype.parent.user,
                pwd: main.data.itemtype.parent.pwd,
                schema: main.data.itemtype.parent.schema,
                envpath: main.data.itemtype.parent.envpath,
                srvspath: main.data.itemtype.parent.srvspath,
                itemtype: main.data.itemtype.parent.itemtype,
                componentid: main.data.others.componentid
            };
            var log = this.addLog("Eliminando documento");
            this.httpfunctions.getData("delete", postdata, function (data) {
                console.log("Registro eliminado");
            }, log);
        },
        //upload document
        uploadDocument: function () {
            //create var to submit
            var postdata = {
                server: main.data.itemtype.parent.server,
                user: main.data.itemtype.parent.user,
                pwd: main.data.itemtype.parent.pwd,
                schema: main.data.itemtype.parent.schema,
                envpath: main.data.itemtype.parent.envpath,
                srvspath: main.data.itemtype.parent.srvspath,
                itemtype: main.data.itemtype.parent.itemtype,
                componentid: (main.data.others.formmetadata.insert) ? "" : main.data.others.componentid,
                data: []
            };
            //push data
            for (var i = 0; i < main.data.schema.length; i++) {
                var schema = main.data.schema[i];
                var valid = true;
                if (schema.schema == 'true') {
                    if (schema.nullable == 'false') {
                        if (schema.value1 == undefined || schema.value1 == "") {
                            valid = false;
                        }
                    }
                    if (valid) {
                        postdata.data.push({
                            name: main.data.schema[i].name,
                            value: main.data.schema[i].value1,
                            type: main.data.schema[i].type
                        });
                    } else {
                        this.addLogObject({
                            msg: "Enviar datos",
                            process: false,
                            response: {status: "error", desc: "debe ingresar los campos obligatorios", det: ""}
                        });
                        return false;
                    }
                }
            }
            //send data
            var log = this.addLog("Subiendo metadata");
            this.httpfunctions.getData("upload-metadata", postdata, function (data) {
                console.log("Proceso finalizado");
            }, log);
        },
        //Upload file to document
        uploadFile: function () {
            //get file
            var file = $scope.fileModel;
            if (file == undefined) {
                return false;
            }
            //get mime
            var mime = file.type;
            while (mime == "") {
                mime = prompt("Archivo desconocido, ingrese mime type", "");
            }
            //get ext
            var ext = file.name.substring(file.name.indexOf(".") + 1);
            //set postdata
            var fd = new FormData();
            fd.append("server", main.data.itemtype.parent.server);
            fd.append("user", main.data.itemtype.parent.user);
            fd.append("pwd", main.data.itemtype.parent.pwd);
            fd.append("schema", main.data.itemtype.parent.schema);
            fd.append("envpath", main.data.itemtype.parent.envpath);
            fd.append("srvspath", main.data.itemtype.parent.srvspath);
            fd.append("itemtype", main.data.itemtype.parent.itemtype);
            fd.append("componentid", main.data.others.componentid);
            fd.append("file", file);

            //call ajax
            var log = this.addLog("Subiendo archivo");
            $http.post("api/rest/upload", fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
                    .success(function (data) {
                        if (typeof (data) === "object") {
                            log.response.status = data.status;
                            log.response.desc = data.desc;
                            log.response.det = data.det;
                        } else {
                            alert("ERROR HTTP!");
                            console.log(data);
                        }
                    })
                    .error(function (data) {
                        alert("ERROR HTTP!");
                        console.log(data);
                    });
        },
        //set form metadata
        setFormAction: function () {
            if (main.data.others.formmetadata.insert) {
                main.data.others.formmetadata.insert = false;
            } else {
                main.data.others.formmetadata.insert = true;
            }
        },
        /***************/
        /*Export Methods*/
        /***************/

        export: function (data, type) {
            var name = "";
            var txt = "";
            switch (type) {
                case "data":
                    if (confirm("Presione ACEPTAR si desea exportar solo una columna (para procesar con aplicacion cliente)?")) {
                        name = "IDS.txt";
                        txt = this.exportDataMigrate(data);
                    } else {
                        name = "data.csv";
                        txt = this.exportData(data);
                    }
                    break;
                case "outline":
                    name = "outline.json";
                    txt = this.exportOutline(data);
                    break;
                case "property":
                    $scope.modal = "exportProperty";
                    name = data.type + ".properties";
                    txt = this.exportFileProperty(data);
                    break;
            }
            //Exportar archivo
            var blob = new Blob([txt], {type: "text/plain;charset=utf-8"});
            saveAs(blob, name);
        },
        exportData: function (data) {
            //to return
            var txt = "";
            //get headers
            var headers = "";
            $.each(data.data.data[0], function (index, value) {
                headers += index + ";";
            });
            headers += "\n";
            //get data
            for (var i = 0; i < data.data.data.length; i++) {
                var tmp = data.data.data[i];
                var line = ""
                $.each(tmp, function (index, value) {
                    line += value + ";";
                });
                txt += line + "\n";
            }
            //create txt
            txt = headers + txt;
            return txt;
        },
        exportDataMigrate: function (data) {
            var fieldUnique = "";
            var headers = "";

            //get headers
            $.each(data.data.data[0], function (index, value) {
                fieldUnique = (fieldUnique == "") ? index : fieldUnique;
                headers += (headers != "") ? "," : "";
                headers += index;
            });

            fieldUnique = prompt("Ingrese campo unico[" + headers + "]", fieldUnique);
            while (fieldUnique == "") {
                fieldUnique = prompt("Ingrese campo unico[" + headers + "]", "");
            }
            //get data
            var txt = "";
            for (var i = 0; i < data.data.data.length; i++) {
                var tmp = data.data.data[i];
                $.each(tmp, function (index, value) {
                    if (index == fieldUnique) {
                        txt += value + "\n";
                    }
                });

            }
            return txt;
        },
        //export outline with connections
        exportOutline: function (data) {
            if (data.length == 0) {
                return false;
            }

            var txt = "";

            var txt = "";

            //get info
            for (var i = 0; i < data.length; i++) {
                var conf = data[i].conf;
                txt += (txt == "") ? "" : ",";
                txt += '{"name":"' + conf.name + '","server":"' + conf.server + '","user":"' + conf.user + '","pwd":"' + conf.pwd + '","schema":"' + conf.schema + '","envpath":"' + conf.envpath.replaceAll("\\","\\\\") + '","srvspath":"' + conf.srvspath.replaceAll("\\","\\\\") + '"}';
            }
            //create txt
            txt = "{\"servers\":[" + txt + "]}";
            return txt;
        },
        exportFileProperty: function (data) {
            var txt = "\n";

            txt += "\nMASTER.CM_SERVER=" + data.master.conf.server;
            txt += "\nMASTER.CM_SCHEMA=" + data.master.conf.schema;
            txt += "\nMASTER.CM_CMBICMENV=" + data.master.conf.envpath.replaceAll("\\","\\\\");
            txt += "\nMASTER.CM_CMBICMSRVS=" + data.master.conf.srvspath.replaceAll("\\","\\\\");

            switch (data.type) {
                case "PropertyJMigrator":
                    txt += "\nMASTER.CM_USER=" + data.master.conf.user;
                    txt += "\nMASTER.CM_PASSWORD=" + data.master.conf.pwd;
                    txt += "\n";
                    txt += "\nSLAVE.CM_SERVER=" + data.slave.conf.server;
                    txt += "\nSLAVE.CM_SCHEMA=" + data.slave.conf.schema;
                    txt += "\nSLAVE.CM_CMBICMENV=" + data.slave.conf.envpath.replaceAll("\\","\\\\");
                    txt += "\nSLAVE.CM_CMBICMSRVS=" + data.slave.conf.srvspath.replaceAll("\\","\\\\");
                    txt += "\nSLAVE.CM_USER=" + data.slave.conf.user;
                    txt += "\nSLAVE.CM_PASSWORD=" + data.slave.conf.pwd;
                    txt += "\n";
                    txt += "\nPROCESS.TYPE=2";
                    txt += "\nPROCESS.ENTITY=" + data.itemtype.id;
                    txt += "\nPROCESS.UNIQUE=COMPONENTID";
                    break;
                case "PropertyJFind":
                    txt += "\nMASTER.CM_USER=" + data.master.conf.user;
                    txt += "\nMASTER.CM_PASSWORD=" + data.master.conf.pwd;
                    txt += "\n";
                    txt += "\nPROCESS.ENTITY=" + data.itemtype.id;
                    txt += "\nPROCESS.UNIQUE=COMPONENTID";
                    break;
                case "PropertyJDelete":
                    txt += "\n";
                    txt += "\nPROCESS.ENTITY=" + data.itemtype.id;
                    break;
            }
            txt += "\nPROCESS.FILEIDS=.\\\\INPUT";
            return txt;
        },
        openExportProperty: function () {
            $scope.modal = "exportProperty";
        },
        /****************/
        /*HTTP FUNCTIONS*/
        /****************/

        /*Http functions*/
        httpfunctions: {},
        setHttpFunctions: function (httpFunctions, http) {
            this.httpfunctions = httpFunctions;
            this.httpfunctions.setHttp(http);
            console.log("Funciones http configuradas correctamente");
        },
        /*add log*/
        addLog: function (msg) {
            main.data.others.logs.push({
                msg: msg,
                process: true,
                response: {status: "", desc: "", det: ""}
            });
            return main.data.others.logs[main.data.others.logs.length - 1];
        },
        /*add log object*/
        addLogObject: function (object) {
            main.data.others.logs.push(object);
        },
    };

    //set http methods
    main.methods.setHttpFunctions(httpFunctions, $http);

});

//Event whit Jquery
$(document).ready(function () {
    $("#dvMessage").delegate(".alert", "click", function () {
        $(this).fadeOut();
    });
});

//Global functions
var getYearsForFilter = function () {
    var agnos = [];
    var currentyear = (new Date()).getFullYear();
    var firstyear = 2005;
    for (var i = firstyear; i <= currentyear; i++) {
        agnos.push(i.toString());
    }
    return agnos;
};

var getMonths = function () {
    return [{id: "00", label: "Todos los meses"},
        {id: "01", label: "Enero"}, {id: "02", label: "Febrero"}, {id: "03", label: "Marzo"}, {id: "04", label: "Abril"},
        {id: "05", label: "Mayo"}, {id: "06", label: "Junio"}, {id: "07", label: "Julio"}, {id: "08", label: "Agosto"},
        {id: "09", label: "Septiembre"}, {id: "10", label: "Octubre"}, {id: "11", label: "Noviembre"}, {id: "12", label: "Diciembre"}];
}

//Javascript prototype
Date.prototype.yyyymmdd = function () {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();
    return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]); // padding
};
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};