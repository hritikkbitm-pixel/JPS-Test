import urllib.request
import time
import threading
import json
import statistics
import concurrent.futures

# Configuration
TARGET_URL = "http://localhost:3000"
MAX_USERS = 5000
STEP_SIZE = 500
DURATION_PER_STEP = 3  # Seconds to run each step

results = []

def make_request():
    start_time = time.time()
    try:
        with urllib.request.urlopen(TARGET_URL) as response:
            response.read()
            # code = response.getcode() # verify 200 if needed
            error = False
    except Exception as e:
        error = True
    end_time = time.time()
    return end_time - start_time, error

def run_step(num_users):
    latencies = []
    errors = 0
    start_step = time.time()
    
    # We want to maintain 'num_users' concurrent requests approx
    # Simple approach: Fire 'num_users' threads, then when they finish, fire again until duration is up?
    # Better approach for simpler script: Launch threads that loop for DURATION
    
    request_count = 0
    lock = threading.Lock()
    
    def user_task():
        nonlocal request_count, errors
        while time.time() - start_step < DURATION_PER_STEP:
            lat, err = make_request()
            with lock:
                latencies.append(lat)
                request_count += 1
                if err:
                    errors += 1
            time.sleep(0.01) # constant pacing to not overwhelm totally instantly

    threads = []
    for _ in range(num_users):
        t = threading.Thread(target=user_task)
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    avg_latency = statistics.mean(latencies) if latencies else 0
    rps = request_count / DURATION_PER_STEP
    print(f"Users: {num_users}, RPS: {rps:.2f}, Avg Latency: {avg_latency:.4f}s, Errors: {errors}")
    return {
        "users": num_users,
        "rps": rps,
        "avg_latency": avg_latency,
        "errors": errors
    }

def main():
    print(f"Starting stress test on {TARGET_URL}")
    for users in range(1, MAX_USERS + 1, STEP_SIZE):
        res = run_step(users)
        results.append(res)
    
    # Save JSON
    with open("stress_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    # Generate HTML Report
    generate_html_report(results)
    print("Stress test complete. Results saved to stress_test_results.json and stress_report.html")

def generate_html_report(data):
    labels = [d["users"] for d in data]
    latency = [d["avg_latency"] * 1000 for d in data] # ms
    rps = [d["rps"] for d in data]
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Stress Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{ font-family: sans-serif; padding: 20px; }}
        .container {{ max_width: 800px; margin: 0 auto; }}
        h1 {{ text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Website Performance Stress Test</h1>
        <canvas id="perfChart"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('perfChart').getContext('2d');
        const data = {{
            labels: {labels},
            datasets: [
                {{
                    label: 'Avg Latency (ms)',
                    data: {latency},
                    borderColor: 'rgb(255, 99, 132)',
                    yAxisID: 'y'
                }},
                {{
                    label: 'Requests Per Second (RPS)',
                    data: {rps},
                    borderColor: 'rgb(54, 162, 235)',
                    yAxisID: 'y1'
                }}
            ]
        }};
        
        new Chart(ctx, {{
            type: 'line',
            data: data,
            options: {{
                responsive: true,
                interaction: {{
                    mode: 'index',
                    intersect: false,
                }},
                scales: {{
                    y: {{
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {{ display: true, text: 'Latency (ms)' }}
                    }},
                    y1: {{
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {{ display: true, text: 'RPS' }},
                        grid: {{
                            drawOnChartArea: false,
                        }},
                    }},
                }}
            }}
        }});
    </script>
</body>
</html>
    """
    with open("stress_report.html", "w") as f:
        f.write(html_content)

if __name__ == "__main__":
    main()
