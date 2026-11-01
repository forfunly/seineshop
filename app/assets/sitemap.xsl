<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" encoding="UTF-8"/>
<xsl:template match="/">
<html lang="en"><head><title>SeineShop XML Sitemap</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>body{font:16px/1.6 system-ui,sans-serif;color:#183b2f;background:#f7f9f5;margin:0;padding:32px}main{max-width:1150px;margin:auto}h1{font-size:32px}a{color:#205c43;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;background:white}th,td{text-align:left;padding:14px;border-bottom:1px solid #dce4da;vertical-align:top}th{background:#e8eee2}.note{color:#56685c}td:last-child{white-space:nowrap}@media(max-width:600px){body{padding:16px}th,td{padding:10px;font-size:13px}td:last-child{white-space:normal}}</style></head>
<body><main><h1>SeineShop XML Sitemap</h1><p><a href="/sitemap-view">Open sitemap management view · 分类管理预览</a></p>
<xsl:choose><xsl:when test="s:sitemapindex"><p>English / 日本語 / Deutsch · Sitemaps grouped by language and page type. Click a link to inspect its URLs.</p><p class="note"><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/> sitemap files. Larger resources are split into numbered files.</p>
<table><thead><tr><th>Resource type</th><th>Language</th><th>Sitemap</th></tr></thead><tbody><xsl:for-each select="s:sitemapindex/s:sitemap"><tr><td><xsl:call-template name="resource"><xsl:with-param name="url" select="s:loc"/></xsl:call-template></td><td><xsl:value-of select="substring-before(substring-after(s:loc,'/sitemap.'),'.')"/></td><td><a href="{s:loc}"><xsl:value-of select="substring-after(substring-after(s:loc,'/sitemap.'),'.')"/></a></td></tr></xsl:for-each></tbody></table>
</xsl:when><xsl:otherwise><p><a href="/sitemap.xml">← All sitemap groups</a></p><p class="note"><xsl:value-of select="count(s:urlset/s:url)"/> canonical URLs. Last modified is shown only when a source timestamp is available.</p><table><thead><tr><th>Page URL</th><th>Last modified</th></tr></thead><tbody><xsl:for-each select="s:urlset/s:url"><tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td><td><xsl:value-of select="s:lastmod"/></td></tr></xsl:for-each></tbody></table></xsl:otherwise></xsl:choose>
<p class="note">This is a search-engine XML sitemap with a human-readable presentation. Only published, indexable routes are included.</p></main></body></html>
</xsl:template>
<xsl:template name="resource"><xsl:param name="url"/><xsl:choose>
<xsl:when test="contains($url,'.products-')">Products · 商品</xsl:when>
<xsl:when test="contains($url,'.collections-')">Product collections · 商品分类</xsl:when>
<xsl:when test="contains($url,'.articles-')">Blog articles · 博客文章</xsl:when>
<xsl:when test="contains($url,'.blog-collections-')">Blog collections · 博客集合</xsl:when>
<xsl:when test="contains($url,'.blog-tags-')">Blog tags · 博客标签</xsl:when>
<xsl:when test="contains($url,'.pages-')">Custom pages · 自定义页面</xsl:when>
<xsl:when test="contains($url,'.policies-')">Policies · 政策</xsl:when>
<xsl:otherwise>Pages</xsl:otherwise></xsl:choose></xsl:template>
</xsl:stylesheet>
