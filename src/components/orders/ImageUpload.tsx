
import React, { useState, useRef } from 'react';
import { useServiceOrderImages } from '@/hooks/useServiceOrderTasks';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Image as ImageIcon, X, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploadProps {
  serviceOrderId?: string;
  taskId?: string;
  title?: string;
}

const ImageUpload = ({ serviceOrderId, taskId, title = "Imagens" }: ImageUploadProps) => {
  const { profile } = useAuth();
  const { images, uploadImage, isUploading } = useServiceOrderImages(serviceOrderId, taskId);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const canManageImages = isAdmin || isManager;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadImage({ file: selectedFile, description });
      setSelectedFile(null);
      setDescription('');
      setPreviewUrl(null);
      setShowUploadDialog(false);
    }
  };

  const handleDeleteImage = async (imageId: string, filePath: string) => {
    try {
      setDeletingImageId(imageId);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('service-order-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('service_order_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast.success('Imagem excluída com sucesso!');
      window.location.reload(); // Simple refresh to update the list
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error('Erro ao excluir imagem: ' + error.message);
    } finally {
      setDeletingImageId(null);
    }
  };

  const canDeleteImage = (image: any) => {
    return canManageImages || image.uploaded_by === profile?.id;
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('service-order-images')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const downloadImage = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('service-order-images')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erro ao baixar imagem');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Imagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Nova Imagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Selecionar Arquivo</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </div>
              
              {previewUrl && (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a imagem..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadDialog(false);
                    setSelectedFile(null);
                    setDescription('');
                    setPreviewUrl(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={getImageUrl(image.file_path)}
                alt={image.file_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadImage(image.file_path, image.file_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canDeleteImage(image) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingImageId === image.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Imagem</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteImage(image.id, image.file_path)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                <p className="font-medium text-sm truncate">{image.file_name}</p>
                {image.description && (
                  <p className="text-xs text-slate-600">{image.description}</p>
                )}
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Por: {image.uploaded_by_user.name}</span>
                  <span>{new Date(image.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {images.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">Nenhuma imagem enviada ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
