<?php
/**
 * SEO Fixes for Traffik Web
 * Ajoute ce code dans functions.php de ton thème enfant Divi
 * Ou crée un plugin custom avec ce fichier
 */

// ============================================
// 1. META TAGS & OPEN GRAPH
// ============================================
add_action('wp_head', 'traffik_seo_meta_tags', 1);
function traffik_seo_meta_tags() {
    // Seulement sur la page d'accueil
    if (is_front_page() || is_home()) {
        ?>
        <!-- SEO Meta Tags -->
        <meta name="description" content="Traffik Web - Agence spécialisée dans l'achat de comptes Facebook Business Manager vérifiés. Solutions marketing digital et gestion de réseaux sociaux pour entreprises.">
        <link rel="canonical" href="<?php echo home_url('/'); ?>">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="<?php echo home_url('/'); ?>">
        <meta property="og:title" content="Traffik Web - Comptes Facebook Business Manager Vérifiés">
        <meta property="og:description" content="Achetez des comptes Facebook Business Manager vérifiés. Agence marketing digital spécialisée réseaux sociaux.">
        <meta property="og:image" content="<?php echo get_template_directory_uri(); ?>/og-image.jpg">
        <meta property="og:locale" content="fr_FR">
        <meta property="og:site_name" content="Traffik Web">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="<?php echo home_url('/'); ?>">
        <meta name="twitter:title" content="Traffik Web - Comptes Facebook Business Manager">
        <meta name="twitter:description" content="Achetez des comptes Facebook Business Manager vérifiés. Solutions marketing digital.">
        <meta name="twitter:image" content="<?php echo get_template_directory_uri(); ?>/og-image.jpg">
        <?php
    }
}

// ============================================
// 2. JSON-LD STRUCTURED DATA
// ============================================
add_action('wp_head', 'traffik_structured_data', 2);
function traffik_structured_data() {
    if (is_front_page() || is_home()) {
        ?>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Traffik Web",
            "url": "https://traffik-web.fr",
            "logo": "https://traffik-web.fr/wp-content/uploads/logo.png",
            "description": "Agence spécialisée dans l'achat de comptes Facebook Business Manager vérifiés et solutions marketing digital.",
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "FR"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+33635505374",
                "contactType": "customer service",
                "availableLanguage": ["French", "English"]
            },
            "sameAs": [
                "https://wa.me/33635505374"
            ]
        }
        </script>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Traffik Web",
            "url": "https://traffik-web.fr",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://traffik-web.fr/?s={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }
        </script>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Marketing Digital",
            "provider": {
                "@type": "Organization",
                "name": "Traffik Web"
            },
            "areaServed": {
                "@type": "Country",
                "name": "France"
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Services Marketing Digital",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Comptes Facebook Business Manager"
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Gestion Réseaux Sociaux"
                        }
                    }
                ]
            }
        }
        </script>
        <?php
    }
}

// ============================================
// 3. SECURITY HEADERS
// ============================================
add_action('send_headers', 'traffik_security_headers');
function traffik_security_headers() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';");
}

// ============================================
// 4. ADD DIMENSIONS TO IMAGES AUTOMATICALLY
// ============================================
add_filter('the_content', 'traffik_add_image_dimensions');
function traffik_add_image_dimensions($content) {
    // Regex pour trouver les images sans width/height
    $pattern = '/<img((?!width|height)[^>])*>/i';

    return preg_replace_callback($pattern, function($matches) {
        $img = $matches[0];

        // Extraire l'URL de l'image
        preg_match('/src=["\']([^"\']+)["\']/i', $img, $src_match);
        if (!empty($src_match[1])) {
            $image_url = $src_match[1];

            // Obtenir les dimensions
            $upload_dir = wp_upload_dir();
            $image_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $image_url);

            if (file_exists($image_path)) {
                $size = getimagesize($image_path);
                if ($size) {
                    $width = $size[0];
                    $height = $size[1];

                    // Ajouter width et height
                    $img = str_replace('<img', '<img width="'.$width.'" height="'.$height.'"', $img);
                }
            }
        }

        return $img;
    }, $content);
}

// ============================================
// 5. FIX WHATSAPP LINK ACCESSIBILITY
// ============================================
add_filter('the_content', 'traffik_fix_whatsapp_links');
function traffik_fix_whatsapp_links($content) {
    // Ajouter du texte aux liens WhatsApp vides
    $pattern = '/<a([^>]*href=["\']https:\/\/wa\.me\/[^"\']+["\'][^>]*)>\s*<\/a>/i';
    $replacement = '<a$1 aria-label="Contactez-nous sur WhatsApp">Contactez-nous sur WhatsApp</a>';

    return preg_replace($pattern, $replacement, $content);
}

// ============================================
// 6. PRELOAD CRITICAL RESOURCES
// ============================================
add_action('wp_head', 'traffik_preload_resources', 1);
function traffik_preload_resources() {
    ?>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="//wa.me">
    <?php
}

// ============================================
// 7. DISABLE WORDPRESS EMOJI (PERFORMANCE)
// ============================================
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

// ============================================
// 8. ADD WEBP SUPPORT
// ============================================
add_filter('upload_mimes', 'traffik_allow_webp');
function traffik_allow_webp($mimes) {
    $mimes['webp'] = 'image/webp';
    $mimes['avif'] = 'image/avif';
    return $mimes;
}
