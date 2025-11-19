import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import html2text
from concurrent.futures import ThreadPoolExecutor
import threading
import json
from collections import defaultdict

# ========== CONFIG ==========
START_URL = "https://www.opentix.life/"  
MAX_WORKERS = 10
OUTPUT_DIR = "output_site"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(f"{OUTPUT_DIR}/pages", exist_ok=True)

# ============================

domain = urlparse(START_URL).netloc
visited = set()
lock = threading.Lock()

site_tree = defaultdict(list)

full_markdown_output = []

def normalize_filename(url_path):
    filename = url_path.strip("/").replace("/", "_")
    if filename == "":
        filename = "index"
    return filename + ".md"

def save_markdown_page(url, html):
    md = html2text.html2text(html)

    parsed = urlparse(url)
    path = normalize_filename(parsed.path)

    page_path = f"{OUTPUT_DIR}/pages/{path}"
    with open(page_path, "w", encoding="utf-8") as f:
        f.write(md)

    return md, path


def crawl_page(url):
    with lock:
        if url in visited:
            return
        visited.add(url)

    print(f"Fetching {url}")

    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return
    except:
        return

    html = response.text
    soup = BeautifulSoup(html, "html.parser")

    title = soup.title.string if soup.title else "No Title"

    md, filename = save_markdown_page(url, html)

    with lock:
        full_markdown_output.append(f"# {title}\n\nURL: {url}\n\n---\n\n{md}\n\n\n")

    parent = str(urlparse(url).path)
    if parent == "":
        parent = "/"

    with lock:
        site_tree[parent].append({
            "title": title,
            "url": url,
            "file": filename
        })

    links = []
    for a in soup.find_all("a", href=True):
        new_url = urljoin(url, a["href"])
        parsed = urlparse(new_url)

        if parsed.netloc == domain:
            with lock:
                if new_url not in visited:
                    links.append(new_url)

    return links


def crawl_website():
    queue = [START_URL]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        while queue:
            futures = {executor.submit(crawl_page, url): url for url in queue}
            queue = []

            for future in futures:
                result = future.result()
                if result:
                    queue.extend(result)


if __name__ == "__main__":
    crawl_website()

    full_md_path = f"{OUTPUT_DIR}/website.md"
    with open(full_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(full_markdown_output))

    print(f"\n📘 Finished: Markdown saved to {full_md_path}")

    tree_path = f"{OUTPUT_DIR}/site_structure.json"
    with open(tree_path, "w", encoding="utf-8") as f:
        json.dump(site_tree, f, indent=4, ensure_ascii=False)

    print(f"🌳 Finished: Structure tree saved to {tree_path}")
