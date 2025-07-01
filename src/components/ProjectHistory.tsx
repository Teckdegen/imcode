
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, ExternalLink, Trash2, Edit, Wallet, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletAuth } from '@/contexts/WalletAuthContext';

interface Project {
  id: string;
  name: string;
  type: string;
  created_at: string;
  status: 'deployed' | 'compiled' | 'draft';
  files: string[];
  contract_address?: string;
  tx_hash?: string;
}

const ProjectHistory = () => {
  const { isConnected } = useAccount();
  const { userProfile } = useWalletAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && userProfile) {
      fetchProjects();
    }
  }, [isConnected, userProfile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'compiled':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isConnected) {
    return (
      <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-electric-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-electric-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-electric-blue-100 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-electric-blue-300/80 mb-6 max-w-sm">
                Connect your wallet to view and manage your Move smart contract projects.
              </p>
              <ConnectButton />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-electric-blue-100 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Project History
        </CardTitle>
        <CardDescription className="text-electric-blue-300">
          Your Move smart contracts and deployment history
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-electric-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-electric-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-electric-blue-100 mb-2">No Projects Yet</h3>
              <p className="text-electric-blue-300/80 text-center max-w-sm">
                Start by using the AI assistant to create your first Move smart contract project.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={project.id}>
                  <div className="group p-4 rounded-lg border border-electric-blue-500/10 bg-cyber-black-300/30 hover:bg-cyber-black-300/50 hover:border-electric-blue-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-electric-blue-100">{project.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(project.status)} text-xs`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-electric-blue-300 hover:text-electric-blue-100">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-electric-blue-300/80 mb-2">
                      {project.type}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-electric-blue-400 mb-3">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.created_at)}
                    </div>
                    
                    {project.files && project.files.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.files.map((file, fileIndex) => (
                          <Badge 
                            key={fileIndex}
                            variant="secondary" 
                            className="text-xs bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/20"
                          >
                            {file}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {project.status === 'deployed' && (
                      <div className="flex flex-col gap-2 text-xs">
                        {project.contract_address && (
                          <div className="flex items-center gap-2">
                            <span className="text-electric-blue-400">Contract:</span>
                            <code className="text-green-300 bg-cyber-black-100/50 px-2 py-1 rounded">
                              {project.contract_address}
                            </code>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-electric-blue-300">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {project.tx_hash && (
                          <div className="flex items-center gap-2">
                            <span className="text-electric-blue-400">TX Hash:</span>
                            <code className="text-green-300 bg-cyber-black-100/50 px-2 py-1 rounded">
                              {project.tx_hash}
                            </code>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-electric-blue-300">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {index < projects.length - 1 && <Separator className="my-4 bg-electric-blue-500/10" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProjectHistory;
