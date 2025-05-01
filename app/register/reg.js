"use client";

import React from "react";
import { useRouter } from "next/navigation"
import { useState } from "react";
import { useTimer } from "react-timer-hook"
import { GetVerCodeHandle } from "./actions.js";


export default function Reg_c() {
	const [warning, setWarning] = useState("")
	const router = useRouter()
	const time = new Date();
	const {
		totalSeconds,
		restart,
	} = useTimer({ time });
	async function getVerCodeInner(event) {
		event.preventDefault();
		if (totalSeconds <= 0) {
			var formData = new FormData(freg)
			if (formData.get("email") == ""){
				alert("请输入邮箱")
				return
			}
			setWarning("")
			const time = new Date()
			const res = await GetVerCodeHandle(formData)
			if ((typeof res == "boolean") && res) {
				time.setSeconds(time.getSeconds() + 60)
				restart(time)
			} else if (typeof res == "number") {
				time.setSeconds(time.getSeconds() + res)
				restart(time)
			} else{
				alert("未知错误")
			}
		}
	}
	async function handleClick(event) {
		event.preventDefault();
		var formData = new FormData(freg);
		for (var pair of formData.entries()) {
			if (pair[0] == "passwd") {
				var password = pair[1]
			}
			if (pair[0] == "passwdCheck") {
				if (pair[1] == password) {
					break
				} else {
					alert("密码不一致")
					return
				}
			}
		}
		let response = await fetch("/api/register", {
			method: "POST",
			body: formData,
			credentials: "include",
		});
		const resString = await response.text()
		switch (response.status) {
			case 200:
				router.replace("/login")
				break;
			case 409:
				switch (resString) {
					case "NameUsed":
						alert("重复的用户名")
						break
					case "EmailAddressUsed":
						alert("重复的邮箱")
						break
				}
				break
			case 400:
				switch(resString) {
					case "expired":
						alert("验证码已过期")
						return
					case "incorrectVerCode":
						alert("验证码无效")
						return
					default:
						alert("未知错误")
						return
				}
			default:
				alert("未知错误");
		}
	}

	return (
		<main className="m-0 m-auto w-5/6">
			<div className="border-gray border-2 rounded shadow-lg w-full flex flex-col items-center">
				<h1 className="text-[40px]">注册</h1>
				<form id="freg" className="flex flex-col w-3/4 gap-6 p-10" onSubmit={handleClick}>
					<div className="bar">
						<label className="title">用户名</label>
						<div className="w-full"><input name="username" maxLength={15} className="w-full border border-gray-400  px-2 py-1 text-gray-700" type="text" autoComplete="off" required /></div>
					</div>
					<div className="bar">
						<label className="title">电子邮箱</label>
						<div className="w-full"><input name="email" className="w-full border border-gray-400  px-2 py-1 text-gray-700" type="email" autoComplete="off" required /></div>
					</div>
					<div className="bar">
						<label className="title">密码</label>
						<div className="w-full"><input name="passwd" className="w-full border border-gray-400  px-2 py-1 text-gray-700" type="password" autoComplete="off" minLength="6" required /></div>
					</div>
					<div className="bar">
						<label className="title">重复密码</label>
						<div className="w-full"><input name="passwdCheck" className="w-full border border-gray-400  px-2 py-1 text-gray-700" type="password" autoComplete="off" minLength="6" required /></div>
					</div>
					<div className="bar">
						<label className="title">验证码</label>
						<div className="w-full"><input name="verCode" className="w-full border border-gray-400  px-2 py-1 text-gray-700" type="text" autoComplete="off" required /></div>
						<button className={"text_b w-44 " + ((totalSeconds == 0) ? null : "text-gray-300")} onClick={e => getVerCodeInner(e)}>
							{(totalSeconds == 0) ? "获取验证码" : totalSeconds + "s后再发送"}
						</button>
					</div>
					<div className="bar text-red-500">{warning}</div>
					<button className=" self-end text_b">注册</button>
				</form>
			</div>
		</main>
	);
}
