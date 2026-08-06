import json
d = json.load(open('app/story/scripts/macau_mystery_02.json', 'r', encoding='utf-8'))
print(f"Title: {d['title']}")
print(f"Chapters: {len(d['chapters'])}")
for c in d['chapters']:
    gps = c.get('gps', {})
    print(f"  {c['id']}: {c['title']} @ {c['location']} ({gps.get('lat','?')},{gps.get('lng','?')})")
