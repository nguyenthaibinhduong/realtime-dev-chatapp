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

        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Lỗi  {errorData[searchParams.get("error")]?.title || "Oops! Page not found"}</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{errorData[searchParams.get("error")]?.message || "Oops! Page not found"}</p>
                <a href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                    Trở về trang chủ
                </a>
            </div>
        </div>

    );
}

export default Error;
