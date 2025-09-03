'use client';

import React from 'react';
import { Input } from './Input';
import { MessageSquare, Users, MessageCircle, Send, Phone, Globe } from 'lucide-react';

export interface SocialMediaData {
  teams?: string;
  wechat?: string;
  whatsapp?: string;
  telegram?: string;
  linkedin?: string;
  other?: string;
}

interface SocialMediaInputProps {
  value: SocialMediaData;
  onChange: (value: SocialMediaData) => void;
  editing?: boolean;
}

const socialPlatforms = [
  { 
    key: 'teams' as keyof SocialMediaData, 
    label: 'Microsoft Teams', 
    icon: Users,
    placeholder: 'user@example.com or username'
  },
  { 
    key: 'wechat' as keyof SocialMediaData, 
    label: 'WeChat', 
    icon: MessageCircle,
    placeholder: 'WeChat ID'
  },
  { 
    key: 'whatsapp' as keyof SocialMediaData, 
    label: 'WhatsApp', 
    icon: Phone,
    placeholder: '+1234567890'
  },
  { 
    key: 'telegram' as keyof SocialMediaData, 
    label: 'Telegram', 
    icon: Send,
    placeholder: '@username'
  },
  { 
    key: 'linkedin' as keyof SocialMediaData, 
    label: 'LinkedIn', 
    icon: Globe,
    placeholder: 'linkedin.com/in/username'
  }
];

export function SocialMediaInput({ value, onChange, editing = false }: SocialMediaInputProps) {
  const handleChange = (platform: keyof SocialMediaData, newValue: string) => {
    onChange({
      ...value,
      [platform]: newValue
    });
  };

  if (!editing) {
    const hasAnySocial = socialPlatforms.some(platform => value[platform.key]);
    
    if (!hasAnySocial) {
      return <p className="text-gray-500 text-sm">No social media accounts added</p>;
    }

    return (
      <div className="space-y-2">
        {socialPlatforms.map((platform) => {
          const platformValue = value[platform.key];
          if (!platformValue) return null;
          
          const Icon = platform.icon;
          return (
            <div key={platform.key} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{platform.label}:</span>
              <span className="text-sm text-gray-900">{platformValue}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {socialPlatforms.map((platform) => {
        const Icon = platform.icon;
        return (
          <div key={platform.key}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Icon className="h-4 w-4" />
              {platform.label}
            </label>
            <Input
              value={value[platform.key] || ''}
              onChange={(e) => handleChange(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}