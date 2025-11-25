import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthAPI } from "@/api/api";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token không tìm thấy trong URL");
      return;
    }

    (async () => {
      try {
        const result: any = await AuthAPI.confirmEmail(token);

        const ok =
          typeof result?.ok === "boolean"
            ? result.ok
            : typeof result?.status === "number"
              ? result.status >= 200 && result.status < 300
              : true;

        const msg =
          result?.msg ||
          result?.message ||
          result?.error ||
          "Xác thực thất bại";

        if (ok) {
          setStatus("success");
          setMessage(msg || "Email đã được xác thực");
        } else {
          setStatus("error");
          setMessage(msg);
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Lỗi khi gọi server");
      }
    })();
  }, [token, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-sky-600 animate-spin" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Đang xác thực email
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Vui lòng chờ trong giây lát — chúng tôi đang kiểm tra token của
                bạn.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Xác thực thành công
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              {message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 rounded-lg bg-sky-600 text-black dark:text-white hover:bg-sky-700 transition"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition"
              >
                Về trang chủ
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-3 text-red-500">⚠️</div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Xác thực thất bại
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              {message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-sky-600 text-black dark:text-white hover:bg-sky-700 transition"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition"
              >
                Về đăng nhập
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
