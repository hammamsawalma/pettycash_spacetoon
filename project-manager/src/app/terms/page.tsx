import { formatDateAr } from "@/lib/format-utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions | Pocket Manager",
    description: "Terms and Conditions and Privacy Policy for the Project and Finance Management System",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#102550] rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">PM</span>
                        </div>
                        <h1 className="text-lg font-black text-gray-900">Terms and Conditions</h1>
                    </div>
                    <a href="/register" className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors">
                        ← Back to Register
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">

                {/* Introduction */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">📋</span>
                        <h2 className="text-xl font-black text-gray-900">Introduction</h2>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Welcome to <strong className="text-gray-900">Pocket Manager</strong>, the project and finance management system.
                        By using this system, you agree to comply with the following terms and conditions.
                        Please read these terms carefully before using the system.
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </section>

                {/* Terms of Use */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">⚖️</span>
                        <h2 className="text-xl font-black text-gray-900">Terms of Use</h2>
                    </div>
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <p>This system is used for managing projects and financial expenses within a work environment only. Personal or unauthorized use is prohibited.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <p>The user is committed to maintaining the confidentiality of their login credentials and not sharing them with anyone else.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <p>All financial records logged via the system (invoices, custodies, purchases) are considered official documents, and the user is responsible for the accuracy of the entered data.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                            <p>Management reserves the right to review all data and transactions recorded in the system for auditing and monitoring purposes.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                            <p>Any attempt to manipulate financial data or gain unauthorized access to higher privileges exposes the user to legal and administrative accountability.</p>
                        </div>
                    </div>
                </section>

                {/* Privacy Policy */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🔒</span>
                        <h2 className="text-xl font-black text-gray-900">Privacy Policy</h2>
                    </div>
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <p><strong className="text-gray-800">Data Collection:</strong> The system collects only the necessary data to operate the service, such as: name, email, phone number, and work-related financial transactions.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <p><strong className="text-gray-800">Data Protection:</strong> All sensitive data, including passwords, are encrypted. Passwords are never stored as plain text.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <p><strong className="text-gray-800">Data Sharing:</strong> User data is not shared with any third party. Data is strictly for internal use only.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                            <p><strong className="text-gray-800">Data Retention:</strong> Financial transaction records are retained in compliance with company policies and legal requirements.</p>
                        </div>
                    </div>
                </section>

                {/* User Responsibilities */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">👤</span>
                        <h2 className="text-xl font-black text-gray-900">User Responsibilities</h2>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>Entering accurate and correct data into all forms and transactions.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>Uploading clear and readable photos of invoices and financial documents.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>Immediately reporting any glitch or data error.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>Adhering to assigned privileges and working within the scope of responsibilities.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>Confirming receipt of financial custodies promptly and settling them per approved procedures.</p>
                        </div>
                    </div>
                </section>

                {/* Disclaimer */}
                <section className="bg-amber-50 rounded-2xl border border-amber-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">⚠️</span>
                        <h2 className="text-xl font-black text-amber-900">Disclaimer</h2>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">
                        The system is provided &quot;as is&quot; without explicit or implicit guarantees. The company bears no responsibility for direct or indirect damages resulting from system use, including data loss or service interruption.
                        The company reserves the right to modify these terms at any time; users will be notified of material changes.
                    </p>
                </section>

                {/* Contact */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 text-center">
                    <p className="text-sm text-gray-500">
                        For any inquiries regarding the Terms and Conditions, please contact us via the{" "}
                        <a href="/support" className="text-blue-600 hover:underline font-bold">Support Page</a>.
                    </p>
                </section>

            </main>
        </div>
    );
}
