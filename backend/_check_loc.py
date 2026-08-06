import json
d = json.load(open('app/locations.zh-CN.json', 'r', encoding='utf-8'))
print(f"{len(d['items'])} locations")
for x in d['items']:
    print(f"  {x['id']}: {x['name']} - {x['summary'][:40]}...")
