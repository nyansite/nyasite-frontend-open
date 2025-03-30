'use client'
import React, { useEffect, useRef, useState, useCallback } from "react"
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline"
//Uppy
import Uppy from '@uppy/core'
import Tus from "@uppy/tus"
import { Dashboard } from "@uppy/react"
import '@uppy/core/dist/style.min.css'
import '@uppy/dashboard/dist/style.min.css'
import '@uppy/drag-drop/dist/style.min.css'
//dragzone
import { useDropzone } from "react-dropzone"
//cropper
import Cropper from "react-cropper"
import "cropperjs/dist/cropper.css"
//react-tag-input
import { WithContext as ReactTags } from 'react-tag-input';
//self
import { UploadCoverFunc, UploadVideoFunc } from "./actions.js"
import "./post.css"
//router
import { useRouter } from 'next/navigation'


//UploadVideo

function UploadVideo({ GetVideoUid, GetVideoStauts }) {
    const [uppyShow, setUppyShow] = useState(true)
    const [uppy] = useState(() => new Uppy({
        debug: true, autoProceed: true,
        restrictions: {
            allowedFileTypes: [
                "video/*",
            ],
            maxNumberOfFiles: 1,
        },
    }).use(Tus, {
        endpoint: "/api/get_upload_url", chunkSize: 150 * 1024 * 1024,
        async onAfterResponse(req, res) {
            var url = req.getURL()
            if (url.includes("upload.")) {
                console.log(url.split("/")[4].split("?")[0])
                GetVideoUid(url.split("/")[4].split("?")[0])
            }
        }
    }).on("complete", () => {
        GetVideoStauts(true)
    }))
    function ChangeUppyShowStatus() {
        if (uppyShow) { setUppyShow(false) }
        else { setUppyShow(true) }
    }
    return (
        <div className="flex flex-col w-full items-center gap-2">
            <div className="text-xl flex gap-2 items-center" >
                <div>视频上传</div>
                <button className="img_b hover:w-14" onClick={ChangeUppyShowStatus}>
                    {uppyShow ?
                        <ArrowsPointingInIcon class="h-12 w-12 text-black" /> :
                        <ArrowsPointingOutIcon class="h-12 w-12 text-black" />
                    }
                </button>
            </div>
            <Dashboard uppy={uppy} id={"dashboard"} style={{ display: uppyShow ? "block" : "none" }}
                height={350} singleFileFullScreen={true} />
        </div>
    )
}

//uploadCover

function UploadCoverContnet({ Token, GetCoverUrl, Display }) {
    const [originalImg, setOriginalImg] = useState()
    const [coverImgBlob, setCoverImgBlob] = useState()
    const [uploadStatus, setUploadStatus] = useState('')
    const cropperRef = useRef()
    //dragzone
    const onDrop = useCallback(acceptFiles => {
        const reader = new FileReader()
        reader.onload = function (e) {
            let base64 = e.target.result
            setOriginalImg(base64)
        }
        reader.readAsDataURL(acceptFiles[0])
    }, [])
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: "image/*" })
    function imgGet(e) {
        const filedata = e.target.files[0]
        let reader = new FileReader()
        reader.onload = function (e) {
            let base64 = e.target.result
            setOriginalImg(base64)
        }
        reader.readAsDataURL(filedata)
    }
    async function uploadCover() {
        var formData = new FormData()
        var coverfile = new File([coverImgBlob], "cover.png", { type: "image/png" })
        formData.append("file", coverfile)
        formData.append("token", Token)
        const result = await UploadCoverFunc(formData)
        if (typeof result != "number") {
            if (result.status == true) {
                GetCoverUrl(result.data.links.url)
                setUploadStatus("上传成功")
            } else {
                setUploadStatus("上传失败")
            }
        } else {
            setUploadStatus("上传失败")
        }

    }
    const onCrop = () => {
        const cropper = cropperRef.current?.cropper;
        const canvas = cropper.getCroppedCanvas()
        let resizedCanvas = document.createElement("canvas");
        let resizedContext = resizedCanvas.getContext("2d");
        resizedCanvas.width = 800;
        resizedCanvas.height = 450;
        resizedContext.drawImage(canvas, 0, 0, 800, 450);
        resizedContext.save()
        resizedCanvas.toBlob((blob) => {
            setCoverImgBlob(blob)
        }, "image/png", 0.75)
    }
    return (
        <>
            <button className="text_b w-36 hover:w-44" style={{ display: Display ? "block" : "none" }} {...getRootProps()}>
                选择图片(可拖拽)
                <input id='file' accept="image/*" type="file" onChange={imgGet} style={{ display: "none" }} {...getInputProps()} />
            </button>
            <div className="w-full" style={{ display: Display ? "block" : "none" }}>
                <Cropper
                    src={originalImg}
                    style={{ height: "100%", width: "100%" }}
                    // Cropper.js options
                    crop={onCrop}
                    ref={cropperRef}
                    marginWidth={800}
                    marginHeight={450}
                    minCropBoxWidth={800}
                    minCropBoxHeight={450}
                    viewMode={2}
                    cropBoxResizable={false}
                    aspectRatio={16 / 9}
                />
            </div>
            <div className=" flex items-center gap-2" style={{ display: Display ? "block" : "none" }}>
                <button className="text_b" onClick={uploadCover} style={{ display: originalImg ? "block" : "none" }}>上传</button>
                <div>{uploadStatus}</div>
            </div>
        </>
    )
}

function UploadCover({ Token, GetCoverUrl }) {
    const [uploadCoverShow, setUploadCoverShow] = useState(true)
    function ChangeUploadCoverShowStatus() {
        if (uploadCoverShow) {
            setUploadCoverShow(false)
        } else {
            setUploadCoverShow(true)
        }
    }
    return (
        <div className="flex flex-col w-full items-center gap-2">
            <div className="text-xl flex gap-2 items-center">
                <div>封面上传</div>
                <button className="img_b hover:w-14" onClick={ChangeUploadCoverShowStatus}>
                    {uploadCoverShow ?
                        <ArrowsPointingInIcon class="h-12 w-12 text-black" /> :
                        <ArrowsPointingOutIcon class="h-12 w-12 text-black" />
                    }
                </button>
            </div>
            <UploadCoverContnet Token={Token} GetCoverUrl={GetCoverUrl} Display={uploadCoverShow} />
        </div>
    )
}


//body

export function Post_c({ Token, TagList, CircleList }) {
    //select tags
    const [uploadVideoStauts, setUploadVideoStauts] = useState(false)
    const [uploadVideoUid, setUploadVideoUid] = useState("")
    const [tags, setTags] = useState([])
    const router = useRouter()
    const suggestions = TagList.map((tag) => {
        return {
            id: String(tag.Id),
            text: tag.Text,
        }
    })
    const delimiters = [180, 20]
    const handleDelete = i => {
        setTags(tags.filter((tag, index) => index !== i));
    };

    const handleAddition = tag => {
        setTags([...tags, tag]);
    };
    const handleDrag = (tag, currPos, newPos) => {
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        // re-render
        setTags(newTags);
    };

    const handleTagClick = index => {
        console.log('The tag at index ' + index + ' was clicked');
    };
    //

    const circles = CircleList.map(i =>
        <option value={i.id} key={i.id}>{i.name}</option>
    )

    const [coverUrl, setCoverUrl] = useState('')
    async function postVideo() {
        let formData = new FormData(video)
        if (formData.get("title") == "") { alert("请输入标题"); return }
        if (coverUrl == "") { alert("请上传封面"); return }
        if (!uploadVideoStauts) { alert("正在上传视频"); return }
        formData.append("cover", coverUrl)
        formData.append("videoUid", uploadVideoUid)
        tags.forEach((tag) => {
            console.log(tag)
            formData.append("tags", tag.id)
        })
        const resStauts = await UploadVideoFunc(formData)
        if (resStauts == 200) {
            alert("上传成功")
            router.push("/post")
        } else {
            alert("上传失败")
        }
    }
    return (
        <main className="flex flex-col w-full items-center">
            <div className="flex flex-col w-7/12 items-center gap-6">
                <UploadVideo GetVideoUid={setUploadVideoUid} GetVideoStauts={setUploadVideoStauts} />
                <UploadCover Token={Token} GetCoverUrl={setCoverUrl} />
                <form id="video" className="flex flex-col w-full gap-6">
                    <div className="bar">
                        <label className="title">社团</label>
                        <select className="w-full border border-gray-400  px-2 py-1" name="author">{circles}</select>
                    </div>
                    <div className="bar">
                        <label className="title">标题</label>
                        <div className="w-full"><input maxLength={20} name="title" className="w-full border border-gray-400  px-2 py-1 text-gray-700" type="text" autoComplete="invaild" /></div>
                    </div>
                    <div className="bar items-start">
                        <label className="title">简介</label>
                        <div className="w-full"><textarea name="description" maxLength={300} rows={4} className="w-full border border-gray-400  px-2 py-1 text-gray-700" autoComplete="invaild" /></div>
                    </div>
                    <div className="bar items-start">
                        <label className="title">标签</label>
                        <div className="w-full">
                            <ReactTags
                                tags={tags}
                                suggestions={suggestions}
                                delimiters={delimiters}
                                handleDelete={handleDelete}
                                handleAddition={handleAddition}
                                handleDrag={handleDrag}
                                handleTagClick={handleTagClick}
                                inputFieldPosition="bottom"
                                minQueryLength={1}
                            />
                        </div>
                    </div>
                </form>
                <div className="flex items-start justify-end w-full h-32">
                    <div className="w-32 flex items-center justify-items-center">
                        <button className="text_b" onClick={postVideo}>发布</button>
                    </div>
                </div>
            </div>
        </main>
    )
}