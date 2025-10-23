import { useSearchParams } from "react-router-dom";
const errorData = {
    'githuboauth': {
        title: "Đăng nhập GitHub thất bại",
        message: "Tài khoản này đã được sử dụng hoặc gặp lỗi không xác định",
    },
}

function Error() {
    const [searchParams] = useSearchParams();

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Lỗi  {errorData[searchParams.get("error")]?.title || "Oops! Page not found"}</h1>
                <p className="text-xl text-gray-600 mb-4">{errorData[searchParams.get("error")]?.message || "Oops! Page not found"}</p>
                <a href="/" className="text-blue-500 hover:text-blue-700 underline">
                    Trở về trang chủ
                </a>
            </div>
        </div>

    );
}

export default Error;