import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import api from '../api/client';
import { clsx } from 'clsx';
import {
    AlertCircle,
    Send,
    Upload,
    FileText,
    ArrowLeft
} from 'lucide-react';

const CATEGORIES = [
    'Phishing',
    'Malware',
    'Unauthorized Access',
    'Data Breach',
    'Ransomware',
    'Other'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const IncidentReportPage = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: CATEGORIES[0],
        priority: 'MEDIUM',
        evidenceUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('priority', formData.priority);
            if (file) {
                formDataToSend.append('evidence', file);
            }

            await api.post('/incidents', formDataToSend);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit incident');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Dashboard
            </button>

            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 tracking-tight">Report Security Incident</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Provide detailed information about the security breach or threat. Our team will review it immediately.
                </p>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                {/* Decorative background light */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="text-sm italic">{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6 md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 ml-1">Incident Title</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
                                        placeholder="e.g., Suspicious login activity detected"
                                    />
                                </div>
                            </div>
                        </div>

                        <CustomSelect
                            label="Category"
                            value={formData.category}
                            onChange={(val) => setFormData({ ...formData, category: val })}
                            options={CATEGORIES}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 ml-1">Priority Level</label>
                            <div className="flex gap-4">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: p as any })}
                                        className={clsx(
                                            "flex-1 py-4 rounded-2xl text-sm font-bold border transition-all",
                                            formData.priority === p
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-400 ml-1">Detailed Description</label>
                            <textarea
                                required
                                rows={5}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:border-primary/50 transition-all placeholder:text-gray-600 resize-none"
                                placeholder="Describe the incident in detail, including steps to reproduce or observed behavior..."
                            ></textarea>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-400 ml-1">Evidence / Screenshots</label>
                            <div
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className={clsx(
                                    "border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-primary/30 transition-all cursor-pointer group relative",
                                    file ? "border-primary/50 bg-primary/5" : ""
                                )}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    accept="image/*,application/pdf"
                                />
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    {file ? <FileText className="text-primary" /> : <Upload className="text-primary" />}
                                </div>
                                <p className="text-sm font-medium text-gray-400">
                                    {file ? file.name : "Click to upload or drag and drop"}
                                </p>
                                <p className="text-xs text-gray-600 mt-2">Maximum file size 10MB (PDF, PNG, JPG)</p>
                                {file && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto px-12 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ml-auto"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IncidentReportPage;
