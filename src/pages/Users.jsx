import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { getUsers, addUser, updateUser, deleteUser } from "../services/db";
import { User, Plus, Shield, Edit, Trash2, X } from "lucide-react";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "../services/firebase";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }

    const onSubmit = async (data) => {
        let secondaryApp = null;
        try {
            if (editingUser) {
                // Update existing user (Firestore only)
                const { password, ...userData } = data; // Ignore password for updates
                await updateUser(editingUser.id, userData);
                toast.success("User updated successfully");
            } else {
                // Create new user
                // 1. Create user in Firebase Auth using a secondary app instance
                secondaryApp = initializeApp(firebaseConfig, "Secondary");
                const secondaryAuth = getAuth(secondaryApp);

                await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);

                // 2. Add user details to Firestore
                const { password, ...userData } = data;
                await addUser(userData);

                // 3. Download Credentials File
                const element = document.createElement("a");
                const fileContent = `# User Credentials\n\n**Name:** ${data.name}\n**Email:** ${data.email}\n**Password:** ${data.password}\n**Role:** ${data.role}\n\n*Please change your password after logging in.*`;
                const file = new Blob([fileContent], { type: 'text/markdown' });
                element.href = URL.createObjectURL(file);
                element.download = `credentials_${data.name.replace(/\s+/g, '_')}.md`;
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
                document.body.removeChild(element);

                toast.success("User created successfully & credentials downloaded");
            }

            reset();
            setShowAddForm(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            console.log("Error Code:", error.code); // DEBUG LOG

            if (error.code === 'auth/email-already-in-use') {
                // Check if user exists in Firestore
                const existingUsers = users.filter(u => u.email === data.email);
                console.log("Existing users in Firestore match:", existingUsers); // DEBUG LOG

                if (existingUsers.length === 0) {
                    console.log("User is orphaned. Triggering confirm."); // DEBUG LOG
                    // User exists in Auth but not in Firestore (Orphaned)
                    if (window.confirm(`The user ${data.email} already exists in the system but has no profile. Do you want to create a profile for them?`)) {
                        try {
                            const { password, ...userData } = data;
                            await addUser(userData);

                            // Download Credentials File (even for recovery, useful to have record)
                            const element = document.createElement("a");
                            const fileContent = `# User Credentials (Recovered)\n\n**Name:** ${data.name}\n**Email:** ${data.email}\n**Role:** ${data.role}\n\n*Note: Password was not changed. Use existing password or reset it.*`;
                            const file = new Blob([fileContent], { type: 'text/markdown' });
                            element.href = URL.createObjectURL(file);
                            element.download = `credentials_${data.name.replace(/\s+/g, '_')}.md`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);

                            toast.success("User profile recovered successfully");
                            reset();
                            setShowAddForm(false);
                            fetchUsers();
                        } catch (innerError) {
                            console.error("Error recovering user:", innerError);
                            toast.error("Failed to recover user profile");
                        }
                    }
                } else {
                    toast.error("Email already in use by an existing user");
                }
            } else {
                toast.error("Failed to save user: " + error.message);
            }
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setValue("name", user.name);
        setValue("email", user.email);
        setValue("role", user.role);
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user? This will remove their access permissions.")) {
            try {
                await deleteUser(id);
                toast.success("User deleted successfully");
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                toast.error("Failed to delete user");
            }
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setShowAddForm(false);
        reset();
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                    <p className="text-gray-500 mt-1">Manage system users and their roles.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => {
                            if (showAddForm) cancelEdit();
                            else setShowAddForm(true);
                        }}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600 transition shadow-sm"
                    >
                        {showAddForm ? <X size={20} /> : <Plus size={20} />}
                        <span>{showAddForm ? "Cancel" : "Add User"}</span>
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-semibold mb-4">{editingUser ? "Edit User" : "Add New User"}</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    {...register("name", { required: "Name is required" })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John Doe"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    {...register("email", { required: "Email is required" })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john@example.com"
                                    disabled={!!editingUser} // Disable email editing
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="********"
                                    />
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    {...register("role", { required: "Role is required" })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                {editingUser ? "Update User" : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-100 font-normal border-b">
                        <tr>
                            <th className="p-3 font-normal">Name</th>
                            <th className="p-3 font-normal">Email</th>
                            <th className="p-3 font-normal">Role</th>
                            <th className="p-3 font-normal">Joined</th>
                            <th className="p-3 font-normal text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                            <User size={16} />
                                        </div>
                                        <span>{user.name}</span>
                                    </td>
                                    <td className="p-4 text-gray-500">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit space-x-1 ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role === 'Admin' && <Shield size={12} />}
                                            <span>{user.role}</span>
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit User"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
