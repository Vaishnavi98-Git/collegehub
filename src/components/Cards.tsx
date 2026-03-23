import { useState } from 'react';
import { UserProfile, Project, Resource } from '../types';
import { 
  Github, 
  ExternalLink, 
  Linkedin, 
  Globe, 
  Calendar, 
  BookOpen, 
  Code, 
  Tag,
  User as UserIcon,
  Trash2,
  Edit,
  Map,
  UserPlus,
  UserMinus,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ProjectCard = ({ project, onEdit, onDelete, isOwner }: { 
  project: Project, 
  onEdit?: () => void, 
  onDelete?: () => void,
  isOwner?: boolean,
  key?: any
}) => {
  return (
    <div className="glass rounded-2xl p-5 card-hover flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-neutral-900 line-clamp-1">{project.title}</h3>
        {isOwner && (
          <div className="flex gap-2">
            <button onClick={onEdit} className="p-1.5 text-neutral-400 hover:text-indigo-600 transition-colors">
              <Edit size={16} />
            </button>
            <button onClick={onDelete} className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <p className="text-neutral-600 text-sm mb-4 line-clamp-3 flex-grow">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <UserIcon size={14} />
          <span>{project.ownerName}</span>
        </div>
        <div className="flex gap-3">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-indigo-600 transition-colors">
              <Github size={18} />
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-indigo-600 transition-colors">
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const ResourceCard = ({ resource, onDelete, isOwner }: { 
  resource: Resource, 
  onDelete?: () => void,
  isOwner?: boolean,
  key?: any
}) => {
  const icons = {
    link: ExternalLink,
    roadmap: Map,
    pdf: BookOpen,
    other: Tag
  };
  const Icon = icons[resource.type] || Tag;

  return (
    <div className="glass rounded-2xl p-4 card-hover flex items-center gap-4">
      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={24} />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-neutral-900 truncate">{resource.title}</h3>
          {isOwner && (
            <button onClick={onDelete} className="p-1 text-neutral-400 hover:text-red-600 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-neutral-500 text-xs truncate mb-2">{resource.description || 'No description provided'}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {resource.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] text-neutral-400 font-medium">#{tag}</span>
            ))}
          </div>
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"
          >
            Access <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export const StudentCard = ({ 
  profile, 
  isFollowing, 
  onFollow, 
  onMessage,
  isCurrentUser 
}: { 
  profile: UserProfile, 
  isFollowing?: boolean,
  onFollow?: () => void,
  onMessage?: () => void,
  isCurrentUser?: boolean,
  key?: any 
}) => {
  return (
    <div className="glass rounded-2xl p-6 card-hover text-center flex flex-col items-center">
      <div className="relative group">
        <img 
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} 
          alt={profile.displayName} 
          className="w-20 h-20 rounded-full border-4 border-white shadow-md mb-4"
          referrerPolicy="no-referrer"
        />
        {profile.isVerified && (
          <div className="absolute top-0 right-0 bg-indigo-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Verified Student">
            <ShieldCheck size={12} />
          </div>
        )}
      </div>
      <h3 className="font-bold text-lg text-neutral-900 mb-1 flex items-center gap-1">
        {profile.displayName}
        {profile.isVerified && <ShieldCheck size={16} className="text-indigo-600" />}
      </h3>
      <p className="text-indigo-600 text-sm font-medium mb-3">{profile.branch} • {profile.year}</p>
      <p className="text-neutral-500 text-xs line-clamp-2 mb-4 h-8">{profile.bio || 'No bio yet.'}</p>
      
      <div className="flex flex-wrap justify-center gap-1 mb-4 h-12 overflow-hidden">
        {profile.skills?.slice(0, 3).map(skill => (
          <span key={skill} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] rounded-full">
            {skill}
          </span>
        ))}
        {(profile.skills?.length || 0) > 3 && (
          <span className="text-[10px] text-neutral-400 self-center">+{profile.skills!.length - 3} more</span>
        )}
      </div>

      {!isCurrentUser && (
        <div className="flex gap-2 mb-6 w-full">
          <button 
            onClick={onFollow}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
              isFollowing 
                ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            )}
          >
            {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          <button 
            onClick={onMessage}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold hover:bg-neutral-50 transition-all"
          >
            <MessageSquare size={14} />
            Message
          </button>
        </div>
      )}

      <div className="flex gap-3 mt-auto">
        {profile.github && (
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <Github size={18} />
          </a>
        )}
        {profile.linkedin && (
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-indigo-600 transition-colors">
            <Linkedin size={18} />
          </a>
        )}
        {profile.portfolio && (
          <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-indigo-600 transition-colors">
            <Globe size={18} />
          </a>
        )}
      </div>
    </div>
  );
};
