/**
 * Created by Administrator on 2016/9/29 0029.
 */
(function($) {
    var uploadQueue = new Array();//上传的队列
    var uploadedQueue = new Array();//已经上传完的队列
    var uploadingQueue = new Array();//正在上传的队列
    var methods = {
        init:function(options){
            var self = this;
            var _options = $.extend(defaultJson,options[0]);

            var getFileSize = function (obj) {
                return obj.size > 1024 * 1024 ? (Math.round(obj.size * 100 / (1024 * 1024)) / 100).toString() + 'MB':(Math.round(obj.size * 100 / 1024) / 100).toString() + 'KB';
            };

            var guid = function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            return this.each(function(){
               $(this).bind("change",function(){
                   var files = this.files;
                   var len = files.length;
                   for(var i = 0;i < len;i++){
                       var obj = {
                           "fileId":guid(),
                           "fileName":files[i].name,
                           "fileSize":getFileSize(files[i]),
                           "fileType":files[i].type
                       }
                       console.log(JSON.stringify(obj));
                       uploadedQueue.push(obj);
                       var html = "<div class='progress'><div class='bar'>0%</div></div>";
                       $(self).parent().parent().append("<p id="+obj.fileId+">"+obj.fileName+"</p>"+html);
                   }
                    /*listener.fileChange(this.files,_options[0]);*/
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
            client.open("post",options.url,true);
            //client.addEventListener("abort", uploadCanceled, false);
            for(var i =0;i<files.length;i++){
                var fd = new FormData();
                fd.append("uploadfile"+i,files[i]);
                client.send(fd);
            }
        }
    };
    //这是上传线程的句柄
    var handlers = {
        // Triggered when all the files in the queue have been processed
        onQueueComplete : function() {
            if (this.settings.onQueueComplete) this.settings.onQueueComplete.call(this, this.settings.queueData);
        },

        // Triggered when a file upload successfully completes
        onUploadComplete : function(file) {
            // Load the swfupload settings
            var settings     = this.settings,
                swfuploadify = this;

            // Check if all the files have completed uploading
            var stats = this.getStats();
            this.queueData.queueLength = stats.files_queued;
            if (this.queueData.uploadQueue[0] == '*') {
                if (this.queueData.queueLength > 0) {
                    this.startUpload();
                } else {
                    this.queueData.uploadQueue = [];

                    // Call the user-defined event handler for queue complete
                    if (settings.onQueueComplete) settings.onQueueComplete.call(this, this.queueData);
                }
            } else {
                if (this.queueData.uploadQueue.length > 0) {
                    this.startUpload(this.queueData.uploadQueue.shift());
                } else {
                    this.queueData.uploadQueue = [];

                    // Call the user-defined event handler for queue complete
                    if (settings.onQueueComplete) settings.onQueueComplete.call(this, this.queueData);
                }
            }

            // Call the default event handler
            if ($.inArray('onUploadComplete', settings.overrideEvents) < 0) {
                if (settings.removeCompleted) {
                    switch (file.filestatus) {
                        case SWFUpload.FILE_STATUS.COMPLETE:
                            setTimeout(function() {
                                if ($('#' + file.id)) {
                                    swfuploadify.queueData.queueSize   -= file.size;
                                    swfuploadify.queueData.queueLength -= 1;
                                    delete swfuploadify.queueData.files[file.id]
                                    $('#' + file.id).fadeOut(500, function() {
                                        $(this).remove();
                                    });
                                }
                            }, settings.removeTimeout * 1000);
                            break;
                        case SWFUpload.FILE_STATUS.ERROR:
                            if (!settings.requeueErrors) {
                                setTimeout(function() {
                                    if ($('#' + file.id)) {
                                        swfuploadify.queueData.queueSize   -= file.size;
                                        swfuploadify.queueData.queueLength -= 1;
                                        delete swfuploadify.queueData.files[file.id];
                                        $('#' + file.id).fadeOut(500, function() {
                                            $(this).remove();
                                        });
                                    }
                                }, settings.removeTimeout * 1000);
                            }
                            break;
                    }
                } else {
                    file.uploaded = true;
                }
            }

            // Call the user-defined event handler
            if (settings.onUploadComplete) settings.onUploadComplete.call(this, file);
        },

        // Triggered when a file upload returns an error
        onUploadError : function(file, errorCode, errorMsg) {
            // Load the swfupload settings
            var settings = this.settings;

            // Set the error string
            var errorString = 'Error';
            switch(errorCode) {
                case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
                    errorString = 'HTTP Error (' + errorMsg + ')';
                    break;
                case SWFUpload.UPLOAD_ERROR.MISSING_UPLOAD_URL:
                    errorString = 'Missing Upload URL';
                    break;
                case SWFUpload.UPLOAD_ERROR.IO_ERROR:
                    errorString = 'IO Error';
                    break;
                case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
                    errorString = 'Security Error';
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
                    alert('The upload limit has been reached (' + errorMsg + ').');
                    errorString = 'Exceeds Upload Limit';
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
                    errorString = 'Failed';
                    break;
                case SWFUpload.UPLOAD_ERROR.SPECIFIED_FILE_ID_NOT_FOUND:
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
                    errorString = 'Validation Error';
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
                    errorString = 'Cancelled';
                    this.queueData.queueSize   -= file.size;
                    this.queueData.queueLength -= 1;
                    if (file.status == SWFUpload.FILE_STATUS.IN_PROGRESS || $.inArray(file.id, this.queueData.uploadQueue) >= 0) {
                        this.queueData.uploadSize -= file.size;
                    }
                    // Trigger the onCancel event
                    if (settings.onCancel) settings.onCancel.call(this, file);
                    delete this.queueData.files[file.id];
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
                    errorString = 'Stopped';
                    break;
            }

            // Call the default event handler
            if ($.inArray('onUploadError', settings.overrideEvents) < 0) {

                if (errorCode != SWFUpload.UPLOAD_ERROR.FILE_CANCELLED && errorCode != SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED) {
                    $('#' + file.id).addClass('uploadify-error');
                }

                // Reset the progress bar
                $('#' + file.id).find('.uploadify-progress-bar').css('width','1px');

                // Add the error message to the queue item
                if (errorCode != SWFUpload.UPLOAD_ERROR.SPECIFIED_FILE_ID_NOT_FOUND && file.status != SWFUpload.FILE_STATUS.COMPLETE) {
                    $('#' + file.id).find('.data').html(' - ' + errorString);
                }
            }

            var stats = this.getStats();
            this.queueData.uploadsErrored = stats.upload_errors;

            // Call the user-defined event handler
            if (settings.onUploadError) settings.onUploadError.call(this, file, errorCode, errorMsg, errorString);
        },

        // Triggered periodically during a file upload
        onUploadProgress : function(file, fileBytesLoaded, fileTotalBytes) {
            // Load the swfupload settings
            var settings = this.settings;

            // Setup all the variables
            var timer            = new Date();
            var newTime          = timer.getTime();
            var lapsedTime       = newTime - this.timer;
            if (lapsedTime > 500) {
                this.timer = newTime;
            }
            var lapsedBytes      = fileBytesLoaded - this.bytesLoaded;
            this.bytesLoaded     = fileBytesLoaded;
            var queueBytesLoaded = this.queueData.queueBytesUploaded + fileBytesLoaded;
            var percentage       = Math.round(fileBytesLoaded / fileTotalBytes * 100);

            // Calculate the average speed
            var suffix = 'KB/s';
            var mbs = 0;
            var kbs = (lapsedBytes / 1024) / (lapsedTime / 1000);
            kbs = Math.floor(kbs * 10) / 10;
            if (this.queueData.averageSpeed > 0) {
                this.queueData.averageSpeed = Math.floor((this.queueData.averageSpeed + kbs) / 2);
            } else {
                this.queueData.averageSpeed = Math.floor(kbs);
            }
            if (kbs > 1000) {
                mbs = (kbs * .001);
                this.queueData.averageSpeed = Math.floor(mbs);
                suffix = 'MB/s';
            }

            // Call the default event handler
            if ($.inArray('onUploadProgress', settings.overrideEvents) < 0) {
                if (settings.progressData == 'percentage') {
                    $('#' + file.id).find('.data').html(' - ' + percentage + '%');
                } else if (settings.progressData == 'speed' && lapsedTime > 500) {
                    $('#' + file.id).find('.data').html(' - ' + this.queueData.averageSpeed + suffix);
                }
                $('#' + file.id).find('.uploadify-progress-bar').css('width', percentage + '%');
            }

            // Call the user-defined event handler
            if (settings.onUploadProgress) settings.onUploadProgress.call(this, file, fileBytesLoaded, fileTotalBytes, queueBytesLoaded, this.queueData.uploadSize);
        },

        // Triggered right before a file is uploaded
        onUploadStart : function(file) {
            // Load the swfupload settings
            var settings = this.settings;

            var timer        = new Date();
            this.timer       = timer.getTime();
            this.bytesLoaded = 0;
            if (this.queueData.uploadQueue.length == 0) {
                this.queueData.uploadSize = file.size;
            }
            if (settings.checkExisting) {
                $.ajax({
                    type    : 'POST',
                    async   : false,
                    url     : settings.checkExisting,
                    data    : {filename: file.name},
                    success : function(data) {
                        if (data == 1) {
                            var overwrite = confirm('A file with the name "' + file.name + '" already exists on the server.\nWould you like to replace the existing file?');
                            if (!overwrite) {
                                this.cancelUpload(file.id);
                                $('#' + file.id).remove();
                                if (this.queueData.uploadQueue.length > 0 && this.queueData.queueLength > 0) {
                                    if (this.queueData.uploadQueue[0] == '*') {
                                        this.startUpload();
                                    } else {
                                        this.startUpload(this.queueData.uploadQueue.shift());
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Call the user-defined event handler
            if (settings.onUploadStart) settings.onUploadStart.call(this, file);
        },

        // Triggered when a file upload returns a successful code
        onUploadSuccess : function(file, data, response) {
            // Load the swfupload settings
            var settings = this.settings;
            var stats    = this.getStats();
            this.queueData.uploadsSuccessful = stats.successful_uploads;
            this.queueData.queueBytesUploaded += file.size;

            // Call the default event handler
            if ($.inArray('onUploadSuccess', settings.overrideEvents) < 0) {
                $('#' + file.id).find('.data').html(' - Complete');
            }

            // Call the user-defined event handler
            if (settings.onUploadSuccess) settings.onUploadSuccess.call(this, file, data, response);
        }

    };

    var listener = {
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
           if (methods[option]) {
                return methods[option].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof option === 'object' || !method) {
                return methods.init.apply(this, arguments);//
            } else {
                $.error('Method' + option + 'does not exist on jQuery.easyUpload');
            }
        }
    });
})(jQuery);
