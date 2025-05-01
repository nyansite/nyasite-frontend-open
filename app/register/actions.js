"use server"
import { headers } from "next/headers";

function get_header() {
    const headersL = headers();
    const JheadersList = {};
    headersL.forEach((v, k) => (JheadersList[k] = v)); //迭代器->JSON
    return JheadersList;
}

export async function GetVerCodeHandle(formData) {
    const res = await fetch("http://localhost:8000/api/get_ver_code_reset_pwd", {
        method:"POST",
        body:formData,
        headers:{cookie:get_header().cookie} })
    if (res.status == 200){
        return true
    }else {
        var result = res.text()
        if(!isNaN(parseFloat(result))){
            return parseInt(result)
        }else{
            return true
        }
    }
}