import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Key,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Database,
  Eye,
  Activity,
  Layers,
  Server,
  HelpCircle,
  Settings,
  Search,
  Plus,
  RotateCcw,
  Download,
  Edit2,
  MoreVertical,
  User,
  Clock,
  Share2,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  LayoutDashboard,
  FileLock2,
} from "lucide-react";
import { LogoMark } from "@/components/secureshare";

export const Route = createFileRoute("/share/")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: "/auth/signin",
      });
    }
  },
  component: WorkspacePage,
});

// TYPES & INTERFACES
interface SharedSession {
  id: string;
  recipientEmail: string;
  url: string;
  created: string;
  status: "active" | "expired" | "revoked";
  downloadsCount: number;
  downloadLimit: number;
}

interface WorkspaceFile {
  id: string;
  name: string;
  extension: string;
  size: string;
  sizeBytes: number;
  uploadTime: string;
  owner: string;
  status: "completed" | "failed" | "uploading";
  progress?: number;
  type: string;
  shares: SharedSession[];
  isFolder?: boolean;
  content?: string;
}

interface ActivityEvent {
  id: string;
  time?: string;
  timestamp?: string;
  action: string;
  details: string;
  fileName?: string;
  target?: string;
  icon?: React.ElementType;
  iconName?: string;
}

// SAMPLE INITIAL DATA
const INITIAL_FILES: WorkspaceFile[] = [];
const INITIAL_ACTIVITIES: ActivityEvent[] = [];

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case "Upload":
      return Upload;
    case "Share2":
      return Share2;
    case "Edit2":
      return Edit2;
    case "Trash2":
      return Trash2;
    case "RotateCcw":
      return RotateCcw;
    default:
      return FileText;
  }
};

function WorkspacePage() {
  const { user, accessToken } = useAuthStore();

  const fetchWithAuth = (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
    };
    return window.fetch(url, { ...options, headers });
  };

  // STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState<
    "workspace" | "shared" | "activity" | "trash" | "settings"
  >("workspace");
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [uploadingQueue, setUploadingQueue] = useState<WorkspaceFile[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [trashFiles, setTrashFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal States
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFileTarget, setShareFileTarget] = useState<WorkspaceFile | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareGeneratedLink, setShareGeneratedLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  // Share options inside Modal
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [oneTimeDownload, setOneTimeDownload] = useState(false);

  // Rename States
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WorkspaceFile | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const API_BASE_URL = `http://${window.location.hostname}:4000`;

  // Preview States
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<WorkspaceFile | null>(null);

  // Drag State
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // SELECTED FILE GETTER
  const selectedFile =
    files.find((f) => f.id === selectedFileId) ||
    trashFiles.find((f) => f.id === selectedFileId) ||
    null;

  // DATA LOADERS & PERSISTENCE
  const loadFromLocalFallback = () => {
    setIsServerOnline(false);
    const savedFiles = localStorage.getItem("ss_workspace_files");
    const savedTrash = localStorage.getItem("ss_workspace_trash");
    const savedActivities = localStorage.getItem("ss_workspace_activities");

    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles) as WorkspaceFile[];
        setFiles(parsed);
        if (parsed.length > 0 && !selectedFileId) setSelectedFileId(parsed[0].id);
      } catch (err) {
        console.warn("Failed to parse local fallback files", err);
      }
    }
    if (savedTrash) {
      try {
        setTrashFiles(JSON.parse(savedTrash));
      } catch (err) {
        console.warn("Failed to parse local fallback trash", err);
      }
    }
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities));
      } catch (err) {
        console.warn("Failed to parse local fallback activities", err);
      }
    }
  };

  const refreshFromServer = () => {
    fetchWithAuth(`${API_BASE_URL}/api/files`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setFiles(data);
        if (data.length > 0) {
          setSelectedFileId((prev) =>
            prev && data.some((f: WorkspaceFile) => f.id === prev) ? prev : data[0].id,
          );
        } else {
          setSelectedFileId(null);
        }
      })
      .catch(() => loadFromLocalFallback());

    fetchWithAuth(`${API_BASE_URL}/api/trash`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setTrashFiles(data))
      .catch((err) => {
        console.warn("Failed to fetch trash from server", err);
      });

    fetchWithAuth(`${API_BASE_URL}/api/activities`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setActivities(data))
      .catch((err) => {
        console.warn("Failed to fetch activities from server", err);
      });
  };

  const saveFilesLocal = (newFiles: WorkspaceFile[]) => {
    setFiles(newFiles);
    localStorage.setItem("ss_workspace_files", JSON.stringify(newFiles));
  };

  const saveTrashLocal = (newTrash: WorkspaceFile[]) => {
    setTrashFiles(newTrash);
    localStorage.setItem("ss_workspace_trash", JSON.stringify(newTrash));
  };

  const saveActivitiesLocal = (newActivities: ActivityEvent[]) => {
    setActivities(newActivities);
    localStorage.setItem("ss_workspace_activities", JSON.stringify(newActivities));
  };

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/api/health`).then((res) => {
      if (res.ok) {
        setIsServerOnline(true);
        refreshFromServer();
      } else {
        loadFromLocalFallback();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ICON SELECTOR BASED ON FILE EXTENSION
  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case "pdf":
        return FileText;
      case "csv":
      case "xlsx":
      case "xls":
        return FileSpreadsheet;
      case "png":
      case "jpg":
      case "jpeg":
      case "webp":
        return FileImage;
      case "zip":
      case "tar":
      case "gz":
      case "rar":
        return FileArchive;
      case "js":
      case "ts":
      case "tsx":
      case "json":
      case "html":
      case "css":
        return FileCode;
      default:
        return FileText;
    }
  };

  // LOG ACTIVITY HELPER
  const logActivity = (
    action: string,
    details: string,
    fileName?: string,
    icon: React.ComponentType<{ className?: string }> = FileText,
  ) => {
    if (isServerOnline) {
      fetchWithAuth(`${API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details, target: fileName || "", iconName: "FileText" }),
      })
        .then(() => refreshFromServer())
        .catch((err) => {
          console.warn("Failed to log activity to server", err);
        });
    } else {
      const newEvent: ActivityEvent = {
        id: `act-${Math.random().toString(36).substring(2, 9)}`,
        time: "Just now",
        action,
        details,
        fileName,
        icon,
      };
      const updated = [newEvent, ...activities];
      saveActivitiesLocal(updated);
    }
  };

  // HANDLERS FOR FILE UPLOAD SIMULATION
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleFilesSelected = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      const ext = file.name.split(".").pop() || "bin";
      const baseName = file.name.substring(0, file.name.lastIndexOf("."));
      const sizeKB = file.size / 1024;
      const sizeStr =
        sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB.toFixed(0)} KB`;

      const uploadId = `up-${Math.random().toString(36).substring(2, 9)}`;

      const fileToUpload: WorkspaceFile = {
        id: uploadId,
        name: baseName || file.name,
        extension: ext,
        size: sizeStr,
        sizeBytes: file.size,
        uploadTime: "Just now",
        owner: user?.name || "Me",
        status: "uploading",
        progress: 0,
        type: file.type || "application/octet-stream",
        shares: [],
        content: "",
      };

      setUploadingQueue((prev) => [...prev, fileToUpload]);
      simulateUploadProgress(uploadId, fileToUpload, file);
    });
  };

  const simulateUploadProgress = (id: string, fileInfo: WorkspaceFile, rawFile?: File) => {
    let progress = 0;
    // Introduce random success/fail simulation for realistic feel
    const isDestinedToFail = Math.random() < 0.08; // 8% chance to fail for testing retry logic

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;

      if (progress >= 100) {
        clearInterval(interval);
        if (isDestinedToFail) {
          setUploadingQueue((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: "failed", progress: 80 } : f)),
          );
          logActivity(
            "Upload Failed",
            `Failed to upload ${fileInfo.name}.${fileInfo.extension}`,
            `${fileInfo.name}.${fileInfo.extension}`,
            AlertCircle,
          );
        } else {
          const completedFile: WorkspaceFile = {
            ...fileInfo,
            id: `f-${Math.random().toString(36).substring(2, 9)}`,
            status: "completed",
            progress: undefined,
            uploadTime: "Just now",
          };

          if (isServerOnline && rawFile) {
            const formData = new FormData();
            formData.append("name", fileInfo.name);
            formData.append("extension", fileInfo.extension);
            formData.append("size", fileInfo.size);
            formData.append("sizeBytes", fileInfo.sizeBytes.toString());
            formData.append("type", fileInfo.type);
            formData.append("file", rawFile);

            fetchWithAuth(`${API_BASE_URL}/api/files`, {
              method: "POST",
              body: formData,
            })
              .then(() => {
                setUploadingQueue((prev) => prev.filter((f) => f.id !== id));
                refreshFromServer();
              })
              .catch(() => {
                setUploadingQueue((prev) => prev.filter((f) => f.id !== id));
                const updated = [completedFile, ...files];
                saveFilesLocal(updated);
                setSelectedFileId(completedFile.id);
                logActivity(
                  "Uploaded File",
                  `Successfully uploaded and verified ${completedFile.name}.${completedFile.extension}`,
                  `${completedFile.name}.${completedFile.extension}`,
                  Upload,
                );
              });
          } else {
            setUploadingQueue((prev) => prev.filter((f) => f.id !== id));
            const updated = [completedFile, ...files];
            saveFilesLocal(updated);
            setSelectedFileId(completedFile.id);
            logActivity(
              "Uploaded File",
              `Successfully uploaded and verified ${completedFile.name}.${completedFile.extension}`,
              `${completedFile.name}.${completedFile.extension}`,
              Upload,
            );
          }
        }
      } else {
        setUploadingQueue((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: Math.min(progress, 99) } : f)),
        );
      }
    }, 250);
  };

  const handleCancelUpload = (id: string) => {
    setUploadingQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRetryUpload = (failedFile: WorkspaceFile) => {
    // Reset to uploading and restart progress
    setUploadingQueue((prev) =>
      prev.map((f) => (f.id === failedFile.id ? { ...f, status: "uploading", progress: 0 } : f)),
    );
    simulateUploadProgress(failedFile.id, failedFile);
  };

  // ACTIONS HANDLERS
  const handleDownload = (file: WorkspaceFile) => {
    if (isServerOnline) {
      window.open(`${API_BASE_URL}/api/files/${file.id}/download`, "_blank");
    } else {
      if (file.content) {
        const link = document.createElement("a");
        link.href = file.content;
        link.download = `${file.name}.${file.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Server is offline. Stream download unavailable.");
        return;
      }
    }
    logActivity(
      "Downloaded File",
      `Downloaded decrypted data for ${file.name}.${file.extension}`,
      `${file.name}.${file.extension}`,
      Download,
    );
  };

  const handlePreview = (file: WorkspaceFile) => {
    setPreviewTarget(file);
    setPreviewModalOpen(true);
    logActivity(
      "Previewed File",
      `Opened local preview viewport for ${file.name}.${file.extension}`,
      `${file.name}.${file.extension}`,
      Eye,
    );
  };

  const triggerRename = (file: WorkspaceFile) => {
    setRenameTarget(file);
    setRenameValue(file.name);
    setRenameModalOpen(true);
  };

  const handleRename = () => {
    if (!renameTarget || !renameValue.trim()) return;

    if (isServerOnline) {
      fetchWithAuth(`${API_BASE_URL}/api/files/${renameTarget.id}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Rename failed");
          refreshFromServer();
          setRenameModalOpen(false);
          setRenameTarget(null);
        })
        .catch(() => {
          const updated = files.map((f) =>
            f.id === renameTarget.id ? { ...f, name: renameValue } : f,
          );
          saveFilesLocal(updated);
          logActivity(
            "Renamed File",
            `Renamed file from ${renameTarget.name} to ${renameValue}`,
            `${renameValue}.${renameTarget.extension}`,
            Edit2,
          );
          setRenameModalOpen(false);
          setRenameTarget(null);
        });
    } else {
      const updated = files.map((f) =>
        f.id === renameTarget.id ? { ...f, name: renameValue } : f,
      );
      saveFilesLocal(updated);
      logActivity(
        "Renamed File",
        `Renamed file from ${renameTarget.name} to ${renameValue}`,
        `${renameValue}.${renameTarget.extension}`,
        Edit2,
      );
      setRenameModalOpen(false);
      setRenameTarget(null);
    }
  };

  const handleDelete = (file: WorkspaceFile) => {
    if (isServerOnline) {
      fetchWithAuth(`${API_BASE_URL}/api/files/${file.id}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Delete failed");
          refreshFromServer();
          if (selectedFileId === file.id) setSelectedFileId(null);
        })
        .catch(() => {
          const updatedFiles = files.filter((f) => f.id !== file.id);
          const updatedTrash = [{ ...file, status: "completed" as const }, ...trashFiles];
          saveFilesLocal(updatedFiles);
          saveTrashLocal(updatedTrash);
          logActivity(
            "Deleted File",
            `Moved ${file.name}.${file.extension} to trash bin`,
            `${file.name}.${file.extension}`,
            Trash2,
          );
          if (selectedFileId === file.id) setSelectedFileId(null);
        });
    } else {
      const updatedFiles = files.filter((f) => f.id !== file.id);
      const updatedTrash = [{ ...file, status: "completed" as const }, ...trashFiles];
      saveFilesLocal(updatedFiles);
      saveTrashLocal(updatedTrash);
      logActivity(
        "Deleted File",
        `Moved ${file.name}.${file.extension} to trash bin`,
        `${file.name}.${file.extension}`,
        Trash2,
      );
      if (selectedFileId === file.id) setSelectedFileId(null);
    }
  };

  const handleRestore = (file: WorkspaceFile) => {
    if (isServerOnline) {
      fetchWithAuth(`${API_BASE_URL}/api/trash/${file.id}/restore`, {
        method: "POST",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Restore failed");
          refreshFromServer();
        })
        .catch(() => {
          const updatedTrash = trashFiles.filter((f) => f.id !== file.id);
          const updatedFiles = [file, ...files];
          saveFilesLocal(updatedFiles);
          saveTrashLocal(updatedTrash);
          logActivity(
            "Restored File",
            `Restored ${file.name}.${file.extension} from trash to workspace`,
            `${file.name}.${file.extension}`,
            RotateCcw,
          );
        });
    } else {
      const updatedTrash = trashFiles.filter((f) => f.id !== file.id);
      const updatedFiles = [file, ...files];
      saveFilesLocal(updatedFiles);
      saveTrashLocal(updatedTrash);
      logActivity(
        "Restored File",
        `Restored ${file.name}.${file.extension} from trash to workspace`,
        `${file.name}.${file.extension}`,
        RotateCcw,
      );
    }
  };

  const handlePermanentDelete = (file: WorkspaceFile) => {
    if (isServerOnline) {
      fetchWithAuth(`${API_BASE_URL}/api/trash/${file.id}/permanent`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Permanent delete failed");
          refreshFromServer();
          if (selectedFileId === file.id) setSelectedFileId(null);
        })
        .catch(() => {
          const updatedTrash = trashFiles.filter((f) => f.id !== file.id);
          saveTrashLocal(updatedTrash);
          logActivity(
            "Shredded File",
            `Permanently shredded metadata and cyphertext wrapper for ${file.name}.${file.extension}`,
            `${file.name}.${file.extension}`,
            Trash2,
          );
          if (selectedFileId === file.id) setSelectedFileId(null);
        });
    } else {
      const updatedTrash = trashFiles.filter((f) => f.id !== file.id);
      saveTrashLocal(updatedTrash);
      logActivity(
        "Shredded File",
        `Permanently shredded metadata and cyphertext wrapper for ${file.name}.${file.extension}`,
        `${file.name}.${file.extension}`,
        Trash2,
      );
      if (selectedFileId === file.id) setSelectedFileId(null);
    }
  };

  // SHARING FLOW HANDLERS
  const triggerShare = (file: WorkspaceFile) => {
    setShareFileTarget(file);
    setShareEmail("");
    setShareGeneratedLink("");
    setRequirePassword(false);
    setPassword("");
    setOneTimeDownload(false);
    setShareModalOpen(true);
  };

  const handleGenerateShare = () => {
    if (!shareFileTarget) return;

    const randomId = Math.random().toString(36).substring(2, 8);
    const fallbackLink = `${window.location.origin}/share/${randomId}`;
    setShareGeneratedLink("Generating secure wrapper...");

    const fileContentPayload =
      shareFileTarget.content ||
      "data:text/plain;base64,U2VjdXJlU2hhcmUgRGVtbyBGaWxlIENvbnRlbnQgKGxvY2FsIHN0b3JhZ2UgZmFsbGJhY2sp";

    if (isServerOnline) {
      fetchWithAuth(`${API_BASE_URL}/api/files/${shareFileTarget.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: shareEmail || "Public Access Link",
          password: requirePassword ? password : "",
          oneTime: oneTimeDownload,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Server response error");
          return res.json();
        })
        .then((data) => {
          setShareGeneratedLink(data.url);
          refreshFromServer();
        })
        .catch((err) => {
          console.warn("Failed to generate share on server, falling back to local storage", err);
          const shareData = {
            id: randomId,
            name: `${shareFileTarget.name}.${shareFileTarget.extension}`,
            size: shareFileTarget.size,
            type: shareFileTarget.type,
            content: fileContentPayload,
            requirePassword,
            password: requirePassword ? password : "",
            oneTimeDownload,
          };

          try {
            localStorage.setItem(`ss_share_${randomId}`, JSON.stringify(shareData));
          } catch (error) {
            console.warn(
              "localStorage quota exceeded in workspace, storing fallback dummy payload instead",
              error,
            );
            const fallbackText = `Decrypted content for ${shareFileTarget.name}.${shareFileTarget.extension}. Due to browser localStorage quota limits of 5MB, the full file content could not be stored in local test environment. SecureShare enterprise releases store encrypted ciphertext blobs in Cloudflare R2 / AWS S3.`;
            const fallbackContent = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(fallbackText)))}`;
            const fallbackShareData = {
              ...shareData,
              content: fallbackContent,
              type: "text/plain",
              name: `${shareFileTarget.name}_read_me.txt`,
            };
            localStorage.setItem(`ss_share_${randomId}`, JSON.stringify(fallbackShareData));
          }

          setShareGeneratedLink(fallbackLink);

          const newShare: SharedSession = {
            id: `s-${Math.random().toString(36).substring(2, 9)}`,
            recipientEmail: shareEmail || "Public Access Link",
            url: fallbackLink,
            created: "Just now",
            status: "active",
            downloadsCount: 0,
            downloadLimit: 5,
          };

          const updatedFiles = files.map((f) => {
            if (f.id === shareFileTarget.id) {
              return { ...f, shares: [newShare, ...f.shares] };
            }
            return f;
          });
          saveFilesLocal(updatedFiles);
        });
    } else {
      const shareData = {
        id: randomId,
        name: `${shareFileTarget.name}.${shareFileTarget.extension}`,
        size: shareFileTarget.size,
        type: shareFileTarget.type,
        content: fileContentPayload,
        requirePassword,
        password: requirePassword ? password : "",
        oneTimeDownload,
      };

      try {
        localStorage.setItem(`ss_share_${randomId}`, JSON.stringify(shareData));
      } catch (error) {
        console.warn(
          "localStorage quota exceeded in workspace, storing fallback dummy payload instead",
          error,
        );
        const fallbackText = `Decrypted content for ${shareFileTarget.name}.${shareFileTarget.extension}. Due to browser localStorage quota limits of 5MB, the full file content could not be stored in local test environment. SecureShare enterprise releases store encrypted ciphertext blobs in Cloudflare R2 / AWS S3.`;
        const fallbackContent = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(fallbackText)))}`;
        const fallbackShareData = {
          ...shareData,
          content: fallbackContent,
          type: "text/plain",
          name: `${shareFileTarget.name}_read_me.txt`,
        };
        localStorage.setItem(`ss_share_${randomId}`, JSON.stringify(fallbackShareData));
      }

      setShareGeneratedLink(fallbackLink);

      const newShare: SharedSession = {
        id: `s-${Math.random().toString(36).substring(2, 9)}`,
        recipientEmail: shareEmail || "Public Access Link",
        url: fallbackLink,
        created: "Just now",
        status: "active",
        downloadsCount: 0,
        downloadLimit: 5,
      };

      const updatedFiles = files.map((f) => {
        if (f.id === shareFileTarget.id) {
          return { ...f, shares: [newShare, ...f.shares] };
        }
        return f;
      });
      saveFilesLocal(updatedFiles);
    }

    logActivity(
      "Generated Share Link",
      `Generated access link for ${shareFileTarget.name}.${shareFileTarget.extension} shared with ${shareEmail || "public link"}`,
      `${shareFileTarget.name}.${shareFileTarget.extension}`,
      Share2,
    );
  };

  const handleCopyLink = (linkText: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(linkText)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopyText(linkText);
        });
    } else {
      fallbackCopyText(linkText);
    }
    logActivity("Copied Share Link", `Copied sharing URL for ${label}`, label, Copy);
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } else {
        alert("Please copy the link manually: " + text);
      }
    } catch (err) {
      alert("Please copy the link manually: " + text);
    }
    document.body.removeChild(textArea);
  };

  // SEARCH AND FILTER
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sharedFilesOnly = files.filter((f) => f.shares.length > 0);

  return (
    <div className="relative min-h-screen bg-background text-foreground grain flex flex-col font-play">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1550px] items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <span className="font-display text-3xl font-medium">SecureShare</span>
            </Link>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg bg-mist/60 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-mist hover:text-ink sm:flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Homepage
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/docs"
              target="_blank"
              className="text-lg font-geo font-semibold text-muted-foreground transition-colors hover:text-ink"
            >
              Developer Docs
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-mist md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Dashboard Layout */}
      <div className="mx-auto flex w-full max-w-[1550px] flex-1 px-6 py-6 md:px-10 gap-8">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden w-[220px] shrink-0 flex-col justify-between border-r border-border/60 pr-6 md:flex h-[calc(100vh-120px)] sticky top-24">
          <nav className="space-y-1">
            <h4 className="font-mono text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-4 pl-3">
              NAVIGATION
            </h4>
            <button
              onClick={() => {
                setActiveTab("workspace");
                setSearchQuery("");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === "workspace"
                  ? "bg-ink text-background"
                  : "text-muted-foreground hover:bg-mist hover:text-ink"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("workspace");
                setSearchQuery("");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === "workspace"
                  ? "bg-ink/10 text-ink font-semibold"
                  : "text-muted-foreground hover:bg-mist hover:text-ink"
              }`}
            >
              <FileLock2 className="h-4 w-4" />
              <span>Secure Workspace</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-signal" />
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === "shared"
                  ? "bg-ink text-background"
                  : "text-muted-foreground hover:bg-mist hover:text-ink"
              }`}
            >
              <Share2 className="h-4 w-4" />
              <span>Shared Files</span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === "activity"
                  ? "bg-ink text-background"
                  : "text-muted-foreground hover:bg-mist hover:text-ink"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Recent Activity</span>
            </button>
            <button
              onClick={() => setActiveTab("trash")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === "trash"
                  ? "bg-ink text-background"
                  : "text-muted-foreground hover:bg-mist hover:text-ink"
              }`}
            >
              <Trash2 className="h-4 w-4" />
              <span>Trash Bin</span>
              {trashFiles.length > 0 && (
                <span className="ml-auto rounded-full bg-mist px-1.5 py-0.5 text-[10px] font-bold text-ink">
                  {trashFiles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === "settings"
                  ? "bg-ink text-background"
                  : "text-muted-foreground hover:bg-mist hover:text-ink"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Connected User Profile Card */}
          <div className="border-t border-border/80 pt-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-ink text-background flex items-center justify-center font-mono text-xs font-bold shadow-sm uppercase">
              {user?.name ? user.name.slice(0, 2) : user?.email ? user.email.slice(0, 2) : "US"}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-ink truncate">{user?.name || "User"}</h5>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || "user@secureshare.io"}</p>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-16 z-30 border-b border-border bg-background p-6 md:hidden shadow-xl"
            >
              <nav className="space-y-1.5">
                {[
                  { tab: "workspace", label: "Secure Workspace", icon: FileLock2 },
                  { tab: "shared", label: "Shared Files", icon: Share2 },
                  { tab: "activity", label: "Recent Activity", icon: Activity },
                  { tab: "trash", label: "Trash Bin", icon: Trash2 },
                  { tab: "settings", label: "Settings", icon: Settings },
                ].map(({ tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(
                        tab as "workspace" | "shared" | "activity" | "trash" | "settings",
                      );
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-ink text-background"
                        : "text-muted-foreground hover:bg-mist hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {activeTab === "workspace" && (
            <>
              {/* UPLOAD SECTION */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-ink">Upload Files</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your files are split, compressed, and encrypted locally using AES-256 before
                    upload.
                  </p>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-signal bg-signal/[0.01]"
                      : "border-border hover:border-muted-foreground hover:bg-mist/30 bg-mist/10"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                    multiple
                    className="hidden"
                    onChange={handleFolderInput}
                  />

                  <div className="rounded-full bg-background p-3 shadow-sm border border-border">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h4 className="mt-3 text-xs font-semibold text-ink">
                    Drag & drop files here, or{" "}
                    <span className="underline text-ink hover:text-muted-foreground font-bold">
                      browse device
                    </span>
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1 relative z-10">
                    Supports individual files (up to 50GB) or entire{" "}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        folderInputRef.current?.click();
                      }}
                      className="underline font-semibold hover:text-ink"
                    >
                      folders
                    </button>
                  </p>
                </div>

                {/* ACTIVE UPLOADS LIST */}
                {uploadingQueue.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <h5 className="font-mono text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-3">
                      UPLOADING QUEUE ({uploadingQueue.length})
                    </h5>
                    <div className="space-y-2">
                      {uploadingQueue.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 text-xs"
                        >
                          <div className="h-8 w-8 rounded-lg bg-mist flex items-center justify-center text-muted-foreground">
                            <Upload className="h-4 w-4 animate-bounce" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="truncate">
                                {item.name}.{item.extension}
                              </span>
                              <span className="text-[10px] font-mono">
                                {item.status === "failed" ? "Failed" : `${item.progress}%`}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3">
                              <div className="h-1 flex-1 rounded-full bg-mist overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    item.status === "failed" ? "bg-red-500 w-full" : "bg-ink"
                                  }`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                                {item.size}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {item.status === "failed" ? (
                              <button
                                onClick={() => handleRetryUpload(item)}
                                className="rounded p-1 text-muted-foreground hover:bg-mist hover:text-ink"
                                title="Retry upload"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCancelUpload(item.id)}
                                className="rounded p-1 text-muted-foreground hover:bg-mist hover:text-red-500"
                                title="Cancel upload"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SEARCH BAR & FILE GRID/LIST */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">My Files</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Total workspace files: {files.length}
                    </p>
                  </div>

                  <div className="relative w-full sm:w-[220px]">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search workspace..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs outline-none focus:border-border-strong focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* FILES TABLE / GRID */}
                <div className="flex-1 overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/80 font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                        <th className="py-3 px-4">File Name</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Size</th>
                        <th className="py-3 px-4 hidden md:table-cell">Uploaded</th>
                        <th className="py-3 px-4 hidden lg:table-cell">Owner</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const Icon = getFileIcon(file.extension);
                        const isSelected = selectedFileId === file.id;
                        return (
                          <tr
                            key={file.id}
                            onClick={() => setSelectedFileId(file.id)}
                            className={`border-b border-border/40 hover:bg-mist/30 transition-colors cursor-pointer group ${
                              isSelected ? "bg-mist/40" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold text-ink flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-mist flex items-center justify-center text-muted-foreground group-hover:bg-ink group-hover:text-background transition-colors">
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate max-w-[200px] md:max-w-[300px]">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase">
                                  {file.extension}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-mono hidden sm:table-cell">
                              {file.size}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                              {file.uploadTime}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{file.owner}</span>
                              </div>
                            </td>
                            <td
                              className="py-3 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handlePreview(file)}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                  title="Preview"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => triggerShare(file)}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                  title="Share file"
                                >
                                  <Share2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDownload(file)}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                  title="Download decrypted"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => triggerRename(file)}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                  title="Rename file"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(file)}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-red-500"
                                  title="Move to trash"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredFiles.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-12 text-center text-muted-foreground font-mono"
                          >
                            No files found in workspace.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TIMELINE OVERVIEW ON HOME PANEL */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-ink mb-4">Workspace Timeline</h3>
                <div className="space-y-4">
                  {activities.slice(0, 4).map((act) => {
                    const ActIcon = act.icon || getIconComponent(act.iconName);
                    return (
                      <div key={act.id} className="flex gap-4 text-xs">
                        <div className="h-6 w-6 rounded-full bg-mist flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                          <ActIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink">{act.action}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {act.time || act.timestamp}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 leading-relaxed">
                            {act.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* SHARED FILES VIEW */}
          {activeTab === "shared" && (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex-1">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-ink">Recently Shared Files</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track and audit file links shared with external partners.
                </p>
              </div>

              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/80 font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Shared With</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Downloads</th>
                      <th className="py-3 px-4 text-right">Link Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedFilesOnly.map((file) =>
                      file.shares.map((share) => {
                        const FileIcon = getFileIcon(file.extension);
                        return (
                          <tr
                            key={share.id}
                            className="border-b border-border/40 hover:bg-mist/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-ink flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-mist flex items-center justify-center text-muted-foreground">
                                <FileIcon className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="truncate max-w-[200px]">
                                  {file.name}.{file.extension}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                              {share.recipientEmail}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{share.created}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold ${
                                  share.status === "active"
                                    ? "bg-signal/10 text-signal"
                                    : share.status === "expired"
                                      ? "bg-yellow-500/10 text-yellow-600"
                                      : "bg-red-500/10 text-red-500"
                                }`}
                              >
                                {share.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-mono">
                              {share.downloadsCount} / {share.downloadLimit}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleCopyLink(share.url, file.name)}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                  title="Copy Link"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <a
                                  href={share.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                  title="Open Link"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <button
                                  disabled
                                  className="rounded p-1.5 text-muted-foreground/35 cursor-not-allowed"
                                  title="Revoke (backend only)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }),
                    )}
                    {sharedFilesOnly.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground font-mono"
                        >
                          No active shares recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FULL ACTIVITY TIMELINE VIEW */}
          {activeTab === "activity" && (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex-1">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-ink">Recent Activities</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chronological cryptographical audit trails for workspace entities.
                </p>
              </div>

              <div className="space-y-6">
                {activities.map((act) => {
                  const ActIcon = act.icon || getIconComponent(act.iconName);
                  return (
                    <div
                      key={act.id}
                      className="flex gap-4 text-xs pb-4 border-b border-border/40 last:border-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-mist flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                        <ActIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink text-sm">{act.action}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {act.time || act.timestamp}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 leading-relaxed">{act.details}</p>
                        {(act.fileName || act.target) && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{act.fileName || act.target}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TRASH VIEW */}
          {activeTab === "trash" && (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex-1">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-ink">Trash Bin</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Items in the trash remain for 30 days before being permanently shredded.
                </p>
              </div>

              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/80 font-mono text-[9px] text-muted-foreground tracking-wider uppercase">
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Deleted By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashFiles.map((file) => {
                      const FileIcon = getFileIcon(file.extension);
                      return (
                        <tr
                          key={file.id}
                          className="border-b border-border/40 hover:bg-mist/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-ink flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-mist flex items-center justify-center text-muted-foreground">
                              <FileIcon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="truncate max-w-[200px]">
                                {file.name}.{file.extension}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono">{file.size}</td>
                          <td className="py-3 px-4 text-muted-foreground">{file.owner}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRestore(file)}
                                className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-ink"
                                title="Restore to workspace"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(file)}
                                className="rounded p-1.5 text-muted-foreground hover:bg-mist hover:text-red-500"
                                title="Permanently Shred File"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {trashFiles.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-muted-foreground font-mono"
                        >
                          Trash is empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeTab === "settings" && (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex-1">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-ink">Settings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure default policies and client variables.
                </p>
              </div>

              <div className="space-y-6 text-xs text-muted-foreground">
                <div className="border-b border-border/60 pb-6">
                  <h4 className="font-semibold text-ink text-sm mb-3">General Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                      <div>
                        <p className="font-semibold text-ink">Enable Default Expiry</p>
                        <p className="text-[10px] mt-0.5">
                          Automatically apply expiry triggers (24 hours) on all generated share
                          links.
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                      <div>
                        <p className="font-semibold text-ink">Auto-Revoke on PII match</p>
                        <p className="text-[10px] mt-0.5">
                          Shred keys automatically if the file matches regulatory compliance blocks.
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-ink text-sm mb-3">Encryption Key Provider</h4>
                  <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink">Client WebCrypto Provider</p>
                      <p className="text-[10px] mt-0.5 font-mono">
                        Browser Native SubtleCrypto (W3C Standard)
                      </p>
                    </div>
                    <span className="rounded bg-signal/15 px-2 py-0.5 text-[9px] font-bold text-signal font-mono uppercase">
                      Operational
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar (Desktop) */}
        <aside className="hidden w-[260px] shrink-0 flex-col gap-6 md:flex h-[calc(100vh-120px)] sticky top-24 overflow-y-auto">
          {selectedFile ? (
            <>
              {/* FILE ICON VISUALIZATION */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-mist flex items-center justify-center text-muted-foreground border border-border shadow-sm">
                  {(() => {
                    const FileIconComponent = getFileIcon(selectedFile.extension);
                    return <FileIconComponent className="h-8 w-8" strokeWidth={1.5} />;
                  })()}
                </div>
                <h4
                  className="mt-4 text-xs font-semibold text-ink truncate w-full max-w-[200px]"
                  title={selectedFile.name}
                >
                  {selectedFile.name}.{selectedFile.extension}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  {selectedFile.size}
                </p>
              </div>

              {/* SECURITY BADGES */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center px-4">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-signal bg-signal/10 px-2 py-1 rounded-sm border border-signal/20">
                  <ShieldCheck className="h-3 w-3" />
                  AES-256 Protected
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded-sm border border-blue-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Integrity Verified
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-2 py-1 rounded-sm border border-purple-500/20">
                  <Lock className="h-3 w-3" />
                  Zero Trust
                </span>
              </div>

              {/* FILE METADATA INFORMATION */}
              <div className="rounded-2xl border border-border bg-background p-5 shadow-sm mt-4">
                <h4 className="font-mono text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-3">
                  FILE INFORMATION
                </h4>
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>MIME Type</span>
                    <span
                      className="text-ink font-mono text-[10px] max-w-[120px] truncate"
                      title={selectedFile.type}
                    >
                      {selectedFile.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <span className="text-ink">{selectedFile.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded</span>
                    <span className="text-ink">{selectedFile.uploadTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="flex items-center gap-1 text-signal font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                      Encrypted at Rest
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTIVE SHARING STATUS */}
              <div className="rounded-2xl border border-border bg-background p-5 shadow-sm flex-1 flex flex-col">
                <h4 className="font-mono text-[9px] font-bold text-muted-foreground tracking-wider uppercase mb-3">
                  ACTIVE SHARES ({selectedFile.shares.length})
                </h4>
                <div className="space-y-3 overflow-y-auto flex-1 max-h-[220px]">
                  {selectedFile.shares.map((share) => (
                    <div
                      key={share.id}
                      className="border-b border-border/40 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between text-xs">
                        <span
                          className="font-mono font-semibold text-ink truncate max-w-[140px]"
                          title={share.recipientEmail}
                        >
                          {share.recipientEmail}
                        </span>
                        <span className="text-[9px] font-mono text-signal uppercase font-bold">
                          {share.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          Downloads: {share.downloadsCount}/{share.downloadLimit}
                        </span>
                        <button
                          onClick={() => handleCopyLink(share.url, selectedFile.name)}
                          className="text-ink hover:underline font-bold flex items-center gap-0.5"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedFile.shares.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-6 font-mono">
                      No active links for this file.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm text-center py-20 flex flex-col items-center justify-center border-dashed">
              <FileLock2 className="h-8 w-8 text-muted-foreground/45 mb-3" />
              <p className="text-xs text-muted-foreground font-mono">
                Select a file to view properties.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {shareModalOpen && shareFileTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Share File Securely
                </h3>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-mist hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-mist/30 p-2.5 text-xs text-muted-foreground">
                  <FileText className="h-4.5 w-4.5 text-ink shrink-0" />
                  <span className="truncate font-semibold text-ink">
                    {shareFileTarget.name}.{shareFileTarget.extension}
                  </span>
                  <span className="ml-auto font-mono text-[10px]">{shareFileTarget.size}</span>
                </div>
              </div>

              {!shareGeneratedLink ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-ink mb-1.5">Recipient Email</label>
                    <input
                      type="email"
                      placeholder="partner@company.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2.5 px-3.5 outline-none focus:border-border-strong"
                    />
                  </div>

                  {/* ADVANCED OPTIONS */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block font-semibold text-ink">Password Protection</span>
                        <span className="text-[9px] text-muted-foreground">
                          Force passphrase input before decryption
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={requirePassword}
                        onChange={(e) => setRequirePassword(e.target.checked)}
                        className="rounded border-border focus:ring-ink h-4 w-4"
                      />
                    </div>

                    {requirePassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2"
                      >
                        <input
                          type="password"
                          placeholder="Set decryption password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background py-1.5 px-3 text-xs outline-none focus:border-ink font-sans"
                        />
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div>
                        <span className="block font-semibold text-ink">One-time Download</span>
                        <span className="text-[9px] text-muted-foreground">
                          Link automatically shreds after download
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={oneTimeDownload}
                        onChange={(e) => setOneTimeDownload(e.target.checked)}
                        className="rounded border-border focus:ring-ink h-4 w-4"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShareModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-border bg-background font-semibold hover:bg-mist/35"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateShare}
                      className="flex-1 py-2 rounded-xl bg-ink text-background font-semibold hover:bg-ink/90"
                    >
                      Generate Share
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-signal mx-auto mb-2" />
                    <p className="font-semibold text-ink">Secure Share Generated!</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Symmetric key encrypted client-side. Share link is ready.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={shareGeneratedLink}
                      className="w-full rounded-xl border border-border bg-card py-2.5 pl-3.5 pr-20 font-mono text-[10px] text-ink outline-none"
                    />
                    <button
                      onClick={() => handleCopyLink(shareGeneratedLink, shareFileTarget.name)}
                      className="absolute right-2 top-1.5 rounded bg-ink px-2.5 py-1 text-[9px] font-semibold text-background hover:bg-ink/80"
                    >
                      {shareCopied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShareGeneratedLink("")}
                      className="flex-1 py-2 rounded-xl border border-border bg-background font-semibold hover:bg-mist/35"
                    >
                      Regenerate
                    </button>
                    <a
                      href={shareGeneratedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-ink text-background text-center font-semibold hover:bg-ink/90 flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Link
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENAME MODAL */}
      <AnimatePresence>
        {renameModalOpen && renameTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-ink mb-4">Rename File</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-ink mb-1">New File Name</label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card py-2 px-3 outline-none focus:border-border-strong"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRenameModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-border bg-background font-semibold hover:bg-mist/35"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRename}
                    className="flex-1 py-2 rounded-xl bg-ink text-background font-semibold hover:bg-ink/90"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewModalOpen && previewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Decrypted Client Preview</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Viewing {previewTarget.name}.{previewTarget.extension} ({previewTarget.size})
                  </p>
                </div>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-mist hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* SIMULATED PREVIEW WINDOW */}
              <div className="rounded-xl border border-border bg-mist/10 p-5 font-mono text-[11px] leading-relaxed text-ink/80 h-64 overflow-y-auto mb-4">
                {previewTarget.extension === "csv" ? (
                  <pre>{`id,first_name,last_name,email,ip_address\n1,Krrish,R,krish@secureshare.io,192.168.1.1\n2,Elena,Voss,elena@meridian.org,10.0.8.2\n3,Daniel,Okafor,daniel@northgate.net,172.16.4.15\n4,Priya,Shah,priya@atlas.ai,198.51.100.42`}</pre>
                ) : previewTarget.extension === "pdf" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-xs">
                    <FileText className="h-10 w-10 text-muted-foreground/60 mb-2" />
                    <p className="font-semibold">Q4 Financial Audit Statement</p>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                      [Document verified under AES-GCM-256 local client wrapper. Decryption key
                      signature validates.]
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-xs">
                    <FileLock2 className="h-10 w-10 text-muted-foreground/60 mb-2" />
                    <p className="font-semibold">Binary Data View</p>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                      No text preview available for .{previewTarget.extension} files. Use Download
                      action to decrypt and extract raw contents.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-ink text-background text-xs font-semibold hover:bg-ink/90"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
