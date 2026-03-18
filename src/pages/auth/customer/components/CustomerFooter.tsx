

const CustomerFooter = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 py-8 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-[1600px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Fix-Link</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    © 2024 Fix-Link. Ethiopia's Leading Service Marketplace.
                </p>
                <div className="flex gap-6 text-slate-400">
                    <a className="hover:text-primary transition flex items-center gap-1 text-xs" href="#">
                        <span className="material-symbols-outlined text-lg">language</span> English
                    </a>
                    <a className="hover:text-primary transition flex items-center gap-1 text-xs" href="#">
                        <span className="material-symbols-outlined text-lg">help</span> Support
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default CustomerFooter;
