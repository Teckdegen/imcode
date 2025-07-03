
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FolderOpen, 
  Calendar, 
  ExternalLink, 
  Trash2, 
  Eye,
  FileText,
  Rocket,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWalletAuth } from '@/contexts/WalletAuthContext';
import type { Json } from '@/integrations/supabase/types';

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  content: string;
  parentId?: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  tx_hash?: string;
  contract_address?: string;
  files?: ProjectFile[];
}

const ProjectHistory = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const { userProfile } = useWalletAuth();

  useEffect(() => {
    loadProjects();
  }, [userProfile]);

  const loadProjects = async () => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert the data to match our Project interface
      const convertedProjects: Project[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        created_at: item.created_at || '',
        tx_hash: item.tx_hash || undefined,
        contract_address: item.contract_address || undefined,
        files: Array.isArray(item.files) ? item.files as ProjectFile[] : []
      }));

      setProjects(convertedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Failed to Load Projects",
        description: "There was an error loading your projects.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project Deleted",
        description: "Project has been permanently deleted."
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <FileText className="w-4 h-4 text-electric-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-electric-blue-500/20 text-electric-blue-300 border-electric-blue-500/30';
    }
  };

  if (loading) {
    return (
      <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 bg-electric-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-electric-blue-300">Loading projects...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-electric-blue-100 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Project History
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-electric-blue-400/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-electric-blue-200 mb-2">No Projects Yet</h3>
            <p className="text-electric-blue-400/70 mb-6">
              Start by asking the AI to create a smart contract, or use the Editor mode to create projects.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-cyber-black-300/30 border-electric-blue-500/10 hover:bg-cyber-black-300/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(project.status)}
                          <h3 className="font-semibold text-electric-blue-100">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-electric-blue-300 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {project.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {project.files && (
                            <span>{project.files.length} file(s)</span>
                          )}
                        </div>

                        {project.contract_address && (
                          <div className="text-xs text-green-300 mb-2">
                            <span className="font-mono bg-cyber-black-100/30 px-2 py-1 rounded">
                              {project.contract_address}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10"
                              onClick={() => setSelectedProject(project)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-cyber-black-400 border-electric-blue-500/20 max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="text-electric-blue-100">
                                {selectedProject?.name}
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              {selectedProject?.files && selectedProject.files.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedProject.files.map((file: ProjectFile, index: number) => (
                                    <div key={index} className="border border-electric-blue-500/20 rounded-lg">
                                      <div className="bg-cyber-black-300/50 px-4 py-2 border-b border-electric-blue-500/20">
                                        <span className="text-electric-blue-200 font-mono text-sm">
                                          {file.name || `file_${index + 1}.move`}
                                        </span>
                                      </div>
                                      <pre className="p-4 text-sm text-electric-blue-200 overflow-x-auto">
                                        <code>{file.content || 'No content available'}</code>
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-electric-blue-400">No files available for this project.</p>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        
                        {project.tx_hash && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                            onClick={() => window.open(`https://explorer.devnet.moved.network/tx/${project.tx_hash}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectHistory;
