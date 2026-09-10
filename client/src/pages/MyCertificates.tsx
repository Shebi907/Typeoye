import React from 'react';
import { Link } from 'react-router-dom';
import { FileBadge, ArrowRight, Award } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';

/**
 * Certificates earned by the user. The backend does not persist issued
 * certificates yet (downloads are generated on demand), so this page shows an
 * honest empty state with a path into the certificate flow.
 */
export default function MyCertificates() {
  return (
    <PageWrapper title="My Certificates" description="Certificates you have earned on TypeOye." icon={FileBadge}>
      <div className="max-w-2xl mx-auto">
        <div className="card p-6 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
            <Award size={28} />
          </div>
          <h2 className="text-lg font-bold mb-1.5">No certificates yet</h2>
          <p className="text-sm text-secondary max-w-sm mx-auto">
            Reach at least 30 WPM and 90% accuracy in one certificate test to earn your first TypeOye certificate.
          </p>
          <Link to="/certificate" className="btn btn-primary px-5 py-2.5 mt-5">
            Start Certificate Test <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
