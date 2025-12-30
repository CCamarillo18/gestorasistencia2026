import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import {
  ArrowLeft,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";
import { apiFetch } from "@/react-app/lib/api";

export default function ImportStudents() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Por favor selecciona un archivo CSV");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch("/api/admin/students/import", { method: "POST", body: formData });
      const ct = response.headers.get("content-type") || "";
      let result: any = null;
      if (ct.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Respuesta no JSON del servidor:", text);
        setError("Respuesta inválida del servidor");
        return;
      }
      if (response.ok) {
        setSuccess(
          `Se importaron ${result.imported} estudiantes exitosamente`
        );
        setImportResult(result);
        setFile(null);
        
        // Reset file input
        const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(result.error || "Error al importar estudiantes");
        if (result.errors && result.errors.length > 0) {
          setImportResult({ imported: result.imported || 0, errors: result.errors });
        }
      }
    } catch (error) {
      console.error("Error al subir archivo:", error);
      setError("Error de conexión");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `nombre,curso,telefono,correo,nombre_acudiente,telefono_acudiente,direccion,seguro_estudiantil,tipo_sangre
González Pérez María,6A,3001234567,maria.gonzalez@ejemplo.com,Juan González,3009876543,Calle 123 #45-67,Sí,O+
Rodríguez López Carlos,6B,3002345678,carlos.rodriguez@ejemplo.com,Ana Rodríguez,3008765432,Carrera 45 #12-34,No,A+
Martínez Silva Ana,7A,3003456789,ana.martinez@ejemplo.com,Pedro Martínez,3007654321,Avenida 67 #89-01,Sí,B+`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_estudiantes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel de Administración</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Importar Estudiantes desde CSV
          </h1>
          <p className="text-gray-600">
            Carga masiva de estudiantes mediante archivo CSV
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Import Results */}
        {importResult && importResult.errors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Errores durante la importación:
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {importResult.errors.map((err, index) => (
                <li key={index} className="text-sm text-yellow-800">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Instrucciones</span>
          </h2>

          <div className="space-y-3 text-gray-700">
            <p className="font-semibold">El archivo CSV debe contener las siguientes columnas:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>nombre</strong>: Apellidos primero, luego nombres (Ej: González Pérez María)
              </li>
              <li>
                <strong>curso</strong>: Nombre del curso (Ej: 6A, 7B, 8A)
              </li>
              <li>
                <strong>telefono</strong>: Teléfono del estudiante (opcional)
              </li>
              <li>
                <strong>correo</strong>: Correo electrónico del estudiante (opcional)
              </li>
              <li>
                <strong>nombre_acudiente</strong>: Nombre completo del acudiente (opcional)
              </li>
              <li>
                <strong>telefono_acudiente</strong>: Teléfono del acudiente (opcional)
              </li>
              <li>
                <strong>direccion</strong>: Dirección de residencia (opcional)
              </li>
              <li>
                <strong>seguro_estudiantil</strong>: "Sí" o "No" (opcional)
              </li>
              <li>
                <strong>tipo_sangre</strong>: Tipo de sangre (Ej: O+, A+, B-, AB+) (opcional)
              </li>
            </ul>
          </div>

          <button
            onClick={downloadTemplate}
            className="mt-6 flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-600/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            <span>Descargar Plantilla CSV</span>
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            <span>Subir Archivo CSV</span>
          </h2>

          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label
                htmlFor="csv-upload"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Selecciona el archivo CSV
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-xl cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3"
              />
            </div>

            {/* Selected File */}
            {file && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-600/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Importar Estudiantes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
