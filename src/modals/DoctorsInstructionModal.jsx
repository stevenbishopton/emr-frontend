const DoctorsInstructionModal = ({ details, onClose, loading, error }) => {
  const instructions = details?.admissionRecord?.content || "No specific instructions recorded.";
  const admissionDate = details?.admissionDate 
    ? new Date(details.admissionDate).toLocaleString() 
    : "N/A";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-gray-800">Doctor's Admission Instructions</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Loading instructions...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!loading && details && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Admission Date:
                </div>
                <div className="text-gray-600 font-semibold">{admissionDate}</div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Admission Record Content:
                </label>
                <div className="p-4 bg-white border border-gray-300 rounded-lg min-h-32 shadow-inner whitespace-pre-wrap text-sm text-gray-800">
                  {instructions}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default DoctorsInstructionModal;