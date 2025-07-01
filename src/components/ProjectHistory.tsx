
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, ExternalLink, Trash2, Edit } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  status: 'deployed' | 'compiled' | 'draft';
  files: string[];
  contractAddress?: string;
  txHash?: string;
}

const ProjectHistory = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'MyToken',
      type: 'Token Contract',
      createdAt: '2024-01-15T10:30:00Z',
      status: 'deployed',
      files: ['Move.toml', 'token.move', 'deploy_token.js'],
      contractAddress: '0x1234...5678',
      txHash: '0xabcd...ef01'
    },
    {
      id: '2',
      name: 'NFT Collection',
      type: 'NFT Contract',
      createdAt: '2024-01-14T15:45:00Z',
      status: 'compiled',
      files: ['Move.toml', 'nft.move', 'metadata.move', 'deploy_nft.js']
    },
    {
      id: '3',
      name: 'Voting System',
      type: 'Governance',
      createdAt: '2024-01-13T09:15:00Z',
      status: 'draft',
      files: ['Move.toml', 'voting.move']
    }
  ]);

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
                    {formatDate(project.createdAt)}
                  </div>
                  
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
                  
                  {project.status === 'deployed' && (
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-electric-blue-400">Contract:</span>
                        <code className="text-green-300 bg-cyber-black-100/50 px-2 py-1 rounded">
                          {project.contractAddress}
                        </code>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-electric-blue-300">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-electric-blue-400">TX Hash:</span>
                        <code className="text-green-300 bg-cyber-black-100/50 px-2 py-1 rounded">
                          {project.txHash}
                        </code>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-electric-blue-300">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {index < projects.length - 1 && <Separator className="my-4 bg-electric-blue-500/10" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProjectHistory;
