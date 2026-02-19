'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function BreadcrumbsSchema() {
  const pathname = usePathname();

  useEffect(() => {
    // Kreiraj breadcrumbs strukturu na osnovu trenutne rute
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Početna',
        item: 'https://kzkpartizan1953.rs',
      },
    ];

    // Mapiranje ruta na imena
    const routeNames: Record<string, string> = {
      'klub': 'Klub',
      'tim': 'Tim',
      'igraci': 'Igrači',
      'o-nama': 'O nama',
      'galerija': 'Galerija',
      'vesti': 'Vesti',
      'kontakt': 'Kontakt',
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: index + 2,
        name: name,
        item: `https://kzkpartizan1953.rs${currentPath}`,
      });
    });

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    };

    // Website schema za bolje SEO
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'KŽK Partizan 1953',
      url: 'https://kzkpartizan1953.rs',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://kzkpartizan1953.rs/vesti?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    };

    // Organization schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'SportsOrganization',
      name: 'KŽK Partizan 1953',
      alternateName: 'Košarkaški ženski klub Partizan 1953',
      url: 'https://kzkpartizan1953.rs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kzkpartizan1953.rs/kzk_partizan.png',
      },
      description: 'Ženski Košarkaški Klub Partizan 1953 - Tradicija, ponos i uspeh od 1953. godine',
      foundingDate: '1953',
      sport: 'Basketball',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Humska 1',
        addressLocality: 'Beograd',
        postalCode: '11000',
        addressCountry: 'RS',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+381-11-264-76-58',
        email: 'info@kzkpartizan1953.rs',
        contactType: 'customer service',
      },
      sameAs: [
        // Add social media links if available
      ],
    };

    // Ukloni postojeće schema ako postoje
    const existingBreadcrumb = document.getElementById('breadcrumb-schema');
    if (existingBreadcrumb) existingBreadcrumb.remove();
    
    const existingWebsite = document.getElementById('website-schema');
    if (existingWebsite) existingWebsite.remove();
    
    const existingOrg = document.getElementById('organization-schema');
    if (existingOrg) existingOrg.remove();

    // Dodaj nove schema
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.id = 'breadcrumb-schema';
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);

    const websiteScript = document.createElement('script');
    websiteScript.id = 'website-schema';
    websiteScript.type = 'application/ld+json';
    websiteScript.text = JSON.stringify(websiteSchema);
    document.head.appendChild(websiteScript);

    const orgScript = document.createElement('script');
    orgScript.id = 'organization-schema';
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(organizationSchema);
    document.head.appendChild(orgScript);

    return () => {
      const breadcrumbToRemove = document.getElementById('breadcrumb-schema');
      if (breadcrumbToRemove) breadcrumbToRemove.remove();
      
      const websiteToRemove = document.getElementById('website-schema');
      if (websiteToRemove) websiteToRemove.remove();
      
      const orgToRemove = document.getElementById('organization-schema');
      if (orgToRemove) orgToRemove.remove();
    };
  }, [pathname]);

  return null;
}
