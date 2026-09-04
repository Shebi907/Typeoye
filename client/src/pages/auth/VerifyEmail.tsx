import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function VerifyEmail() {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
        <CheckCircle2 size={36} />
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        No Verification Required
      </h1>
      <p className="text-sm mb-6 text-secondary leading-relaxed">
        Email verification is no longer required for Typeoye. You can sign up and start typing immediately!
      </p>
      <Link to="/progress">
        <Button variant="primary" size="lg" className="w-full">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
