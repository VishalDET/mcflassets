import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import ThreeBackground from "../components/ThreeBackground";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const cardRef = useRef(null);
    const formRef = useRef(null);
    const logoRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(cardRef.current,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 1 }
        )
            .fromTo(logoRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.8 },
                "-=0.5"
            )
            .fromTo(formRef.current.children,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 },
                "-=0.4"
            );
    }, { scope: containerRef });

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError("Failed to log in: " + err.message);
            // Shake animation on error
            gsap.to(cardRef.current, {
                x: [-10, 10, -10, 10, 0],
                duration: 0.4,
                ease: "power2.inOut"
            });
        }
        setLoading(false);
    }

    return (
        <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* 3D Background */}
            <ThreeBackground />

            {/* Login Card */}
            <div
                ref={cardRef}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                    <div ref={logoRef} className="flex flex-col items-center pt-8 pb-4">
                        <div className="bg-white/90 p-3 rounded-2xl shadow-lg mb-4">
                            <img
                                src="/niyantra.jpeg"
                                alt="Niyantra Logo"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-blue-100/60 text-sm mt-1">Please enter your details</p>
                    </div>

                    {error && (
                        <div className="mx-8 mb-4 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm animate-pulse">
                            {error}
                        </div>
                    )}

                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="space-y-5 p-8"
                    >
                        <div className="space-y-2">
                            <label className="block text-blue-100/80 text-sm font-medium ml-1">Email Address</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-100/40 group-focus-within:text-blue-400 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-100/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-blue-100/80 text-sm font-medium ml-1">Password</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-100/40 group-focus-within:text-blue-400 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-100/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ShieldCheck size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col items-center gap-2">
                        <div className="text-blue-100/40 font-light text-[11px] text-center">
                            NIYANTRA — SMART ASSET MANAGEMENT
                        </div>
                        <a
                            href="https://digitaledgetech.in/"
                            className="text-blue-400/80 hover:text-blue-300 font-medium text-[10px] transition-colors"
                        >
                            © 2025 Digital Edge Technologies
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
