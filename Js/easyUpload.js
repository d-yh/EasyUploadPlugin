/**
 * Created by Administrator on 2016/9/29 0029.
 */
(function($) {

    var methods = {
        init:function(options){
            var _options = $(defaultJson,options);
            return this.each(function(){//为dom节点绑定事件
                $(this).bind("change",function(){
                    listener.fileChange(this.files,_options);
                });
            });
        },
        upload:function(files,options){
            var client = new XMLHttpRequest();//创建一个Ajax Http请求;

            /*client.onreadystatechange = function () {
                if(client.readyState === XMLHttpRequest.DONE && client.status === 200){
                    console.log(client.responseText);
                }
            };*/

            client.upload.addEventListener("progress", listener.uploading, false);
            client.addEventListener("load", listener.success, false);
            client.addEventListener("error", listener.error, false);
            client.open("post",options[0].url,true);
            //client.addEventListener("abort", uploadCanceled, false);
            for(var i =0;i<files.length;i++){
                var fd = new FormData();
                fd.append("uploadfile"+i,files[i]);
                client.send(fd);
            }
        }
    };

    var listener = {
        fileChange:function(files,options){
            methods.upload(files,options);
        },
        success:function(evt){

        },
        error:function(evt){

        },
        uploading:function(evt){
            console.log(evt.loaded);
        }
    };

    var defaultJson = {
        isAutoUpload:true,//是否自动上传
        url:"http://localhost:8080/TestUploadFile/servlet/UpLoadServlet",//服务器地址
        fileName:"file",//文件名称
        option:{},//其它参数
        max:200000,//最大上传
        timeout:30, //上传超时时间
        uploadSuccess:listener.success,
        uploadError:listener.error,
        uploading:listener.uploading,
    };

    $.fn.extend({
        easyUpload:function (option){
           return methods.init.apply(this,arguments);
           /* if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);//
            } else {
                $.error('Method' + method + 'does not exist on jQuery.easyUpload');
            }
            return this;*/
        }
    });
})(jQuery);
