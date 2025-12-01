import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError("Failed to log in: " + err.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-0 rounded-lg shadow-md w-full max-w-md">

                <div className="flex justify-center mb-4">
                    <img src="/niyantra.jpeg" alt="Niyantra Logo" className="h-full w-full object-contain border-t border-r border-l border-gray-300 rounded-t-lg" />
                </div>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-8">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4 p-8 pt-0">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        Login to Your Account
                    </h2>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <Mail size={18} />
                            </span>
                            <input
                                type="email"
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                <Lock size={18} />
                            </span>
                            <input
                                type="password"
                                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black border-2 border-black text-white font-bold py-2 px-4 rounded-lg hover:bg-white hover:text-black hover:border-black hover:border-2 transition duration-300 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="p-2 border-t border-gray-300 text-center bg-gray-200 flex items-center justify-between rounded-b-lg">
                    <div className="text-center text-gray-600 font-light text-[10px] py-2">
                        Niyantra — Smart Asset Management System
                    </div>
                    <a href="https://digitaledgetech.in/" className="text-gray-600 font-light py-2 text-[10px]">© 2025 Digital Edge Technologies</a>
                </div>
            </div>
        </div>
    );
}
