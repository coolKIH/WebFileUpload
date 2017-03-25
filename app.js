(function(document) {
      var myUploadApp = (function() {
          var
              tasksInProgress = [],
              taskFace = document.getElementById("task-face"),
              taskItemIdTillNow = 0,
              clearFinished = document.getElementById("clear-finished"),
              bodyScrollTop;

        function startListening(elemId, acceptedTypes, maxFileSizeInBytes) {
            acceptedTypes = acceptedTypes || [];
            var
                uploadField = document.getElementById(elemId) || document.body,
                regexAcceptedTypes = new RegExp(acceptedTypes.join("|"), "i");

            function dragenter(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            function dragover(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            function drop(e) {
                e.preventDefault();
                e.stopPropagation();

                var items = e.dataTransfer.items,
                    itemNum = items.length,
                    index = 0;

                for(; index < itemNum; index++) {
                    var item = items[index].webkitGetAsEntry();
                    if(item) {
                        traversFileTree(item);
                    }
                }
            }

            function UploadFaceItem(fileName, fileSizeInBytes, taskItemId, fileType) {
                this.fileName = fileName;
                this.fileSizeInMB = ( fileSizeInBytes / (1024 * 1024) ).toFixed(2);
                this.taskItemId = taskItemId;
                this.fileType = fileType;

                this.templateHTML = document.getElementById("task-item-template").innerHTML;
            }

            UploadFaceItem.prototype.getElementHTML = function() {
                return renderHTML(this.templateHTML, this);
            };

            function renderHTML(template, obj) {
                return template.replace(/{{([a-zA-Z]+)}}/g, function(index, attr) {
                   return obj[attr];
                });
            }

            function traversFileTree(item, path) {
                path = path || "";
                if(item.isFile) {
                  item.file(function(file) {
                    var
                        fileName = file.name,
                        fileSize = file.size,
                        regexGetType = /\.([^\.]+$)/,
                        fileType = fileName.match(regexGetType);
                        fileType = fileType?fileType[1]:"";

                    if(regexAcceptedTypes.test(fileType) && ( fileSize <= maxFileSizeInBytes || !maxFileSizeInBytes ) ) {
                        var taskItemId = taskItemIdTillNow++;
                        var taskItemHTML = new UploadFaceItem(fileName, fileSize, taskItemId, fileType).getElementHTML();
                        taskFace.insertAdjacentHTML("beforeend", taskItemHTML);
                        var taskItemElem = taskFace.querySelector("[data-id=\""+taskItemId+"\"]");
                        postFile(file, "/file-upload.php", onConnectionFinished(taskItemElem), onUploading(taskItemElem), onUploadFinished(taskItemElem));
                    }
                  })
                } else if(item.isDirectory) {
                  var dirReader = item.createReader();
                  dirReader.readEntries(function(entries) {
                    var index = 0, entryNum = entries.length;

                    for(; index < entryNum; index++) {
                      traversFileTree(entries[index], path + item.name + "/");
                    }
                  });
                }
            }
            uploadField.addEventListener("dragenter", dragenter, false);
            uploadField.addEventListener("dragover", dragover, false);
            uploadField.addEventListener("drop", drop, false);

            function clearFinishedItems() {
                var finishedItems = taskFace.querySelectorAll("div[data-finished='yes']"),
                    itemNum = finishedItems.length,
                    index = 0;
                for(; index < itemNum; index++) {
                    taskFace.removeChild(finishedItems[index]);
                }
            }
            clearFinished.addEventListener("click", clearFinishedItems, false);

            document.addEventListener("scroll", function() {
                bodyScrollTop = document.body.scrollTop;
            }, false);

            setInterval(function() {
                if(bodyScrollTop > clearFinished.offsetTop) {
                    clearFinished.classList.add("fixed-top");
                } else {
                    clearFinished.classList.remove("fixed-top");
                }
            }, 200);

            function onUploadFinished(taskItemElem) {
              return function(e) {
                  console.log("上传完毕");
              }
            }
            function onUploading(taskItemElem) {
                var progressWrapper = taskItemElem.querySelector(".upload-progress-wrapper");
                return function(e) {
                    if (e.lengthComputable) {
                        var percentage = Math.round((e.loaded * 100) / e.total);
                        progressWrapper.style.width = percentage + "%";
                    }
                }
            }
            function onConnectionFinished(taskItemElem) {
                return function(e) {
                    taskItemElem.setAttribute("data-finished", "yes");
                    //taskFace.removeChild(taskItemElem);
                }
            }
            function setMaxFileSizeInBytes(customSizeInBytes) {
                maxFileSizeInBytes = customSizeInBytes;
            }
            return {
                setMaxFileSizeInBytes: setMaxFileSizeInBytes
            }
        }

        function postFile(file, url, loadSuccessCallback, uploadProgressListener, uploadSuccessListener) {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", url, true);

          xhr.onload = function() {
            if(this.status === 200) {
              loadSuccessCallback(this.response);
            }
          };

          xhr.upload.addEventListener("progress", uploadProgressListener, false);
          xhr.upload.addEventListener("load", uploadSuccessListener, false);

          var formData = new FormData();
          formData.append("file", file);
          xhr.send(formData);
        }

        return {
          startListening: startListening
        };

      })();

      var
          maxFileSizeNow = 15,
          mb2b = 1024 * 1024,
          ctrl = myUploadApp.startListening("upload-file-field", ["pdf", "doc", "docx"], maxFileSizeNow * mb2b),
          maxFileSizeReader = document.getElementById("max-file-size-m"),
          maxValue = maxFileSizeReader.querySelector("#max-value"),
          buttonPlusMaxFileSize = document.getElementById("plus"),
          buttonMinusMaxFileSize = document.getElementById("minus");

      function plusMaxFileSize() {
          maxFileSizeNow++;
          updateMaxFileSize();
      }
      function minusMaxFileSize() {
        maxFileSizeNow--;
        if (maxFileSizeNow < 1) {
            maxFileSizeNow = 1;
        }
        updateMaxFileSize();
      }
      function updateMaxFileSize() {
          ctrl.setMaxFileSizeInBytes(maxFileSizeNow * mb2b);
          maxValue.innerText = maxFileSizeNow;
      }
      buttonPlusMaxFileSize.addEventListener("click", plusMaxFileSize, false);
      buttonMinusMaxFileSize.addEventListener("click", minusMaxFileSize, false);
})(document);