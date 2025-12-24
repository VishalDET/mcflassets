
import React, { useState } from 'react';
import pkg from '../../package.json';
import { useAuth } from '../context/AuthContext';
import { User, Info, HelpCircle, Shield, FileText, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

const AccordionItem = ({ title, content, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-100 rounded-lg overflow-hidden transition-all duration-200 hover:border-gray-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/50'}`}
            >
                <span className="font-medium text-gray-800">{title}</span>
                {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50 bg-gray-50/30">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default function UserProfile() {
    const { currentUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('user-info');

    const tabs = [
        { id: 'user-info', label: 'User Info', icon: User },
        { id: 'software-info', label: 'Software Info', icon: Info },
        { id: 'help', label: 'Help', icon: HelpCircle },
        { id: 'privacy', label: 'Privacy Policy', icon: Shield },
        // { id: 'licenses', label: 'Licenses', icon: FileText },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h1>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-200
                  ${activeTab === tab.id
                                        ? 'border-b-2 border-gray-500 text-gray-600 bg-gray-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    } `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-8 min-h-[400px]">
                    {activeTab === 'user-info' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">User Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <span className="block text-sm text-gray-500 mb-1">Email Address</span>
                                    <span className="text-lg font-medium text-gray-900">{currentUser?.email}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <span className="block text-sm text-gray-500 mb-1">Role</span>
                                    <span className="text-lg font-medium text-gray-900 capitalize">{currentUser?.role || 'User'}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <span className="block text-sm text-gray-500 mb-1">User ID</span>
                                    <span className="text-sm font-mono text-gray-600">{currentUser?.uid}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <span className="block text-sm text-gray-500 mb-1">Account Status</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'software-info' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Software Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Application Name</span>
                                    <span className="font-medium text-gray-900">Niyantra Asset Manager</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Version</span>
                                    <span className="font-medium text-gray-900">v{pkg.version}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Build Number</span>
                                    <span className="font-medium text-gray-900">{pkg.version}.{new Date().getFullYear()}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Environment</span>
                                    <span className="font-medium text-gray-900">Production</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Copyright</span>
                                    <span className="font-medium text-gray-900">© {new Date().getFullYear()} Digital Edge Technologies</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Contact Developer</span>
                                    <span className="font-medium text-gray-900">com@digitaledgetech.in</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'help' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Help & Support</h2>
                            <div className="prose max-w-none text-gray-600">
                                <p className='mb-4'>
                                    Need assistance with the Asset Manager? Here are some resources to help you out.
                                </p>
                                <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded mb-6">
                                    <h3 className="text-gray-800 font-semibold mb-2">Contact Support</h3>
                                    <p className="text-gray-700">
                                        For critical issues, please reach out to our IT support team at <a href="mailto:com@digitaledgetech.in" className="underline">com@digitaledgetech.in</a>
                                    </p>
                                </div>

                                <h3 className="text-lg font-medium text-gray-800 mb-2">Common FAQs</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>How do I reset my password? - Contact your administrator.</li>
                                    <li>How do I request a new asset? - Go to the Assets page and use the request form (if enabled).</li>
                                    <li>Where can I see my assigned assets? - Check the 'My Assets' section in the Dashboard.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Privacy Policy</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        title: "1. Introduction",
                                        content: "Welcome to Niyantra Asset Management (\"we,\" \"our,\" or \"us\"). We are committed to protecting your privacy and ensuring the security of your data. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you use our SaaS platform and services."
                                    },
                                    {
                                        title: "2. Data We Collect",
                                        content: (
                                            <div className="space-y-2">
                                                <p>We collect information to provide and improve our services to you:</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li><strong>Account Information:</strong> Name, email address, company name, phone number, and billing details provided during registration.</li>
                                                    <li><strong>Asset Data:</strong> Information about the assets you manage through our platform, including hardware specifications, locations, and user assignments.</li>
                                                    <li><strong>Usage Data:</strong> Information on how you interact with our platform, including log files, device information, and analytics.</li>
                                                </ul>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "3. How We Use Your Data",
                                        content: (
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>To provide, maintain, and improve our SaaS platform.</li>
                                                <li>To process transactions and manage your subscription.</li>
                                                <li>To generate asset reports and analytics as requested by you.</li>
                                                <li>To communicate with you regarding updates, security alerts, and support.</li>
                                                <li>To comply with legal obligations and enforce our terms.</li>
                                            </ul>
                                        )
                                    },
                                    {
                                        title: "4. Data Security",
                                        content: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest, strict access controls, and regular security assessments. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
                                    },
                                    {
                                        title: "5. Data Retention & Rights",
                                        content: (
                                            <div className="space-y-2">
                                                <p>We retain your data for as long as your account is active or as needed to provide services. You have the right to:</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Access information we hold about you.</li>
                                                    <li>Request correction of inaccurate data.</li>
                                                    <li>Request deletion of your data (subject to legal retention requirements).</li>
                                                    <li>Export your asset data from the platform.</li>
                                                </ul>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "6. Third-Party Services",
                                        content: "We may share data with trusted third-party service providers (e.g., cloud hosting, payment processors) strictly for the purpose of operational service delivery. We do not sell your data to advertisers."
                                    }
                                ].map((section, index) => (
                                    <AccordionItem
                                        key={index}
                                        title={section.title}
                                        content={section.content}
                                        defaultOpen={index === 0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* {activeTab === 'licenses' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Open Source Licenses</h2>
                            <div className="prose max-w-none text-gray-600">
                                <p className="mb-4">
                                    This application uses the following open source software:
                                </p>
                                <div className="space-y-4">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold text-gray-800">React</h4>
                                        <p className="text-sm text-gray-500">MIT License - Copyright (c) Meta Platforms, Inc. and affiliates.</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold text-gray-800">Tailwind CSS</h4>
                                        <p className="text-sm text-gray-500">MIT License - Copyright (c) Tailwind Labs, Inc.</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold text-gray-800">Lucide React</h4>
                                        <p className="text-sm text-gray-500">ISC License - Copyright (c) Lucide Contributors</p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold text-gray-800">Firebase</h4>
                                        <p className="text-sm text-gray-500">Apache License 2.0 - Copyright (c) Google LLC</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )} */}
                </div>
            </div>

            <div className='bg-white rounded-lg shadow-lg p-6 mt-2'>
                <h2 className="text-md font-semibold text-gray-800 border-b pb-2">More Information</h2>
                <p className="text-gray-600 mt-2 text-sm">
                    for more information about the software visit our website -

                    <a href="http://niyantra.digitaledgetech.in" target="_blank" rel="noopener noreferrer">https://niyantra.digitaledgetech.in</a>
                </p>
            </div>
        </div>
    );
}
