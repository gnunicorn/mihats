import os

if os.environ.get('SERVER_SOFTWARE', '').startswith('Dev'):
    jerry = dict(
        key="agxkZXZ-ai1lcnJpY29yDwsSCUFwcEFjY2VzcxgGDA",
        secret="816cd19005e54c3cafb4a6b31b915ad1",
        end_point="http://localhost:9090/api/v1/")
else:
    jerry = dict(
        key="agxkZXZ-ai1lcnJpY29yDwsSCUFwcEFjY2VzcxgGDA",
        secret="816cd19005e54c3cafb4a6b31b915ad1")

