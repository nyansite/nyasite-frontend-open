"use client"
import { useLayoutEffect, useState, useRef, useEffect } from "react";

import { HandThumbUpIcon, BookmarkIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { NPlayer } from "./nplayer.ts";
import { Popover } from "nplayer";
import { Plugin } from "@nplayer/danmaku";
import Hls from 'hls.js'
import "./video.css"

import Modal from 'react-modal';
import { useRouter } from "next/navigation.js";

import { SubscribeFunc, SendBullet, LikeVideo, MarkVideo, WithdrawVideoFunc } from "./actions.js";

export function VideoPlayer({ VideoUrl, DanmakuOptions, Vid }) {
    const player = useRef();
    const hls = useRef(new Hls)
    const Quantity = useRef(
        {
            el: document.createElement("div"),
            init() {
                this.btn = document.createElement("div")
                this.btn.textContent = "画质";
                this.el.appendChild(this.btn)
                this.popover = new Popover(this.el)
                this.btn.addEventListener("click", () => this.popover.show())
                // 点击按钮的时候展示 popover
                this.el.style.display = "none"
                // 默认隐藏
                this.el.classList.add("quantity")
            }
        }
    )
    useEffect(() => {
        player.current.on('DanmakuSend', async function (opts) {
            var formData = new FormData()
            formData.append("vid", Vid)
            formData.append("text", opts.text)
            formData.append("color", opts.color)
            formData.append("time", opts.time)
            formData.append("type", opts.type)
            const resStauts = await SendBullet(formData)
            switch (resStauts) {
                case 200:
                    break
                case 401:
                    alert("无法验证登录状态")
                    break
                default:
                    alert("发送失败")
            }
        })
        hls.current.attachMedia(player.current.video)
        hls.current.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls.current.on(Hls.Events.MANIFEST_PARSED, function () {
                //https://nplayer.js.org/docs/examples/quantity-switch
                //// 4. 给清晰度排序，清晰度越高的排在最前面
                hls.current.levels.sort((a, b) => b.height - a.height)
                const frag = document.createDocumentFragment()
                // 5. 给与清晰度对应的元素添加，点击切换清晰度功能
                const listener = (i) => (init) => {
                    const last = Quantity.current.itemElements[Quantity.current.itemElements.length - 1]
                    const prev = Quantity.current.itemElements[Quantity.current.value] || last
                    const el = Quantity.current.itemElements[i] || last
                    prev.classList.remove("quantity_item-active")
                    el.classList.add("quantity_item-active")
                    Quantity.current.btn.textContent = el.textContent
                    if (init !== true && !player.current.paused)
                        setTimeout(() => player.current.play())
                    // 因为 HLS 切换清晰度会使正在播放的视频暂停，我们这里让它再自动恢复播放
                    Quantity.current.value = hls.current.currentLevel = hls.current.loadLevel = i
                    Quantity.current.popover.hide()
                }
                // 6. 添加清晰度对应元素
                Quantity.current.itemElements = hls.current.levels.map((l, i) => {
                    const el = document.createElement("div")
                    el.textContent = l.name + "P"
                    if (l.height === 1080) el.textContent = "1080p 超清"
                    if (l.height === 720) el.textContent = "720p 高清"
                    if (l.height === 480) el.textContent = "480p 清晰"
                    if (l.height === 360) el.textContent = "360p 普通"
                    if (l.height === 240) el.textContent = "240p 快速"
                    el.classList.add("quantity_item")
                    el.addEventListener("click", listener(i))
                    frag.appendChild(el)
                    return el
                })
                const el = document.createElement("div")
                el.textContent = "自动"
                el.addEventListener("click", listener(-1))
                el.classList.add("quantity_item")
                frag.appendChild(el)
                Quantity.current.itemElements.push(el)
                // 这里再添加一个 `自动` 选项，HLS 默认是根据网速自动切换清晰度

                Quantity.current.popover.panelEl.appendChild(frag)
                Quantity.current.el.style.display = "block"

                listener(1)(true)
                // 初始化当前清晰度
            })
            hls.current.loadSource(VideoUrl)
        })
    }, [])
    return (
        <div className=" w-4/5">
            <NPlayer
                ref={player}
                className=" w-full"
                options={{
                    controls: [[
                        "play",
                        "volume",
                        "time",
                        "spacer",
                        Quantity.current,
                        "airplay",
                        "settings",
                        "web-fullscreen",
                        "fullscreen",
                        "danmaku-settings"
                    ], ['progress']],
                    plugins: [new Plugin(DanmakuOptions)],
                }}
            />
        </div>
    )
}

export function LikeBar({ Vid, Likes, IsLiked, Marks, IsMarked }) {
    const countLike = (IsLiked ? Likes - 1 : Likes)
    const countMark = (IsMarked ? Marks - 1 : Marks)
    const [isLiked, setIsLiked] = useState(IsLiked)
    const [isMarked, setIsMarkded] = useState(IsMarked)
    async function handleLikeVideo() {
        var formData = new FormData()
        formData.append("vid", Vid)
        const code = await LikeVideo(formData)
        if (code == 200) {
            setIsLiked(!isLiked)
            return
        } else {
            alert("发送点赞失败")
            return
        }
    }
    async function handleMarkVideo() {
        var formData = new FormData()
        formData.append("vid", Vid)
        const code = await MarkVideo(formData)
        if (code == 200) {
            setIsMarkded(!isMarked)
            return
        } else {
            alert("收藏失败")
            return
        }
    }
    return (
        <div className=" h-12 flex justify-start items-center gap-1 text-[#516e8b]">
            <div className="flex justify-start items-center gap-1">
                <button className=" h-11 w-11 flex justify-center items-center" onClick={handleLikeVideo}>
                    <HandThumbUpIcon className={"h-10 w-10 " + (isLiked ? "fill-[#516e8b]" : null)} />
                </button>
                <div className="text-4xl">
                    {isLiked ? countLike + 1 : countLike}
                </div>
            </div>
            <div className="flex justify-start items-center gap-1">
                <button className=" h-11 w-11 flex justify-center items-center" onClick={handleMarkVideo}>
                    <BookmarkIcon className={"h-10 w-10 " + (isMarked ? "fill-[#516e8b]" : null)} />
                </button>
                <div className="text-4xl">
                    {isMarked ? countMark + 1 : countMark}
                </div>
            </div>
        </div>
    )
}

export function Descrption({ Desc }) {
    const [doesHideOverflow, setDoesHideOverflow] = useState(false)
    const descrptionDiv = useRef()
    const [isOverflow, setIsOverflow] = useState(true)
    useLayoutEffect(() => {
        setIsOverflow(descrptionDiv.current.clientHeight < descrptionDiv.current.scrollHeight)
    }, [])
    return (
        <div className=" w-full flex flex-col items-end gap-1">
            <div className="w-full ">
                <div className={doesHideOverflow ? null : "line-clamp-3"} ref={descrptionDiv}>
                    {Desc}
                </div>
            </div>
            {isOverflow ? <button onClick={() => setDoesHideOverflow(!doesHideOverflow)} className=" text_b w-16 h-8 hover:w-16">
                {doesHideOverflow ? "收起" : "展开"}
            </button> : null}
        </div>
    )

}

export function Author({ Author }) {
    const [relation, setRelation] = useState(Author.Relation)
    async function subscribe(cid) {
        var formData = new FormData
        formData.append("cid", cid)
        const resStauts = await SubscribeFunc(formData)
        if (resStauts == 200) {
            if (relation == -1) {
                setRelation(0)
                alert("关注成功")
            }
            if (relation == 0) {
                setRelation(-1)
                alert("取关成功")
            }
            return
        } else {
            alert("关注失败")
            return
        }
    }
    var subscribeDisplay
    switch (relation) {
        case -2:
            subscribeDisplay = <div className="flex justify-start items-center text-slate-400"><div>没有登录</div></div>;
            break
        case -1:
            subscribeDisplay = <div className="flex justify-start items-center text-slate-400"><button onClick={() => subscribe(Author.Id)}>关注</button></div>;
            break
        case 0:
            subscribeDisplay = <div className="flex justify-start items-center text-slate-400"><button onClick={() => subscribe(Author.Id)}>取消关注</button></div>;
            break
        case 1:
        case 2:
        case 3:
        case 4:
            subscribeDisplay = <a className="flex justify-start items-center text-slate-400"><div>社团管理</div></a>;
            break
        default:
            subscribeDisplay = <div className="flex justify-start items-center text-slate-400"><div>出错</div></div>;

    }
    return (
        <div className=" flex justify-start items-center h-full gap-2">
            <a className=" h-full" href={"/circle/" + Author.Id}><img src={Author.Avatar} className=" h-full" /></a>
            <div className="flex flex-col justify-between flex-nowrap h-full">
                <a className="flex justify-start w-full text-xl" href={"/circle/" + Author.Id}>{Author.Name}</a>
                {subscribeDisplay}
            </div>
        </div>
    )
}

const modalStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        height: '18rem',
        width: '80vw'
    },
};

export function Tags({ tags }) {
    const tagsItems = tags.map(i => 
        <a href={"/search?tags="+i.text+";&text="} className="border" key={i.id}>
            <div className=" m-1">{i.text}</div>
        </a>
    )
    return <div className=" flex justify-items-center h-8 items-center gap-2 w-full">
        {tagsItems}
    </div>
}

export function Withdraw({ Vid }) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    async function withdraw() {
        var formData = new FormData(input)
        formData.append("vid", Vid)
        const resStauts = await WithdrawVideoFunc(formData)
        if (resStauts == 200) {
            alert("撤回成功")
            router.push("/")
        } else {
            alert("撤回失败")
        }
    }
    return (
        <>
            <button className="text_b" onClick={() => setIsOpen(true)} >撤回视频</button>
            <Modal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                style={modalStyles}
                ariaHideApp={false}
            >
                <div className="flex flex-auto flex-col gap-0">
                    <button className="h-12 w-12 self-end" onClick={() => setIsOpen(false)}>
                        <XMarkIcon className="h-10 w-10" />
                    </button>
                    <div className="self-center flex flex-auto flex-col items-center w-full gap-2 mx-11">
                        <form className="flex flex-auto w-full h-full" id="input">
                            <textarea rows={5} className="w-full border" name="reason" />
                        </form>
                        <button className="text_b self-end" onClick={withdraw}>撤回</button>
                    </div>
                </div>
            </Modal>
        </>
    )
}