import subprocess
import os

content = "At Yeelo Homeopathy, we believe in the power of natural healing and preventive care. If youâre in Sohna and searching for effective homeopathic remedies, youâve come to the right place\u0021 Our approach focuses on treating the root cause of health issues rather than just the symptoms. Homeopathy offers a variety of remedies tailored to individual needs. For instance, if youâre dealing with seasonal allergies, remedies like Allium Cepa can provide relief from sneezing and runny nose. For stress and anxiety, consider Ignatia, which is known for its calming effects. Each remedy is selected based on your unique symptoms and overall well-being. In addition to personalized treatments, here are some practical health tips to enhance your wellness journey:  1. **Stay Hydrated**: Water is essential for maintaining overall health. Aim for at least 8 glasses a day. 2. **Balanced Diet**: Incorporate fresh fruits and vegetables into your meals. Nutrient-rich foods can boost your immune system. 3. **Regular Exercise**: Even a daily walk can improve your mood and health. 4. **Mindfulness Practices**: Techniques like meditation can help manage stress effectively. At Yeelo Homeopathy, weâre committed to guiding you on your path to better health through safe, gentle, and effective remedies. If youâre in Sohna and looking for a natural approach to wellness, reach out to us today to learn more about how homeopathy can benefit you and your loved ones. Your journey to holistic health starts here\u0021"

env = os.environ.copy()
env["POST_CONTENT"] = content

print("🚀 Running automation script with debug content...")
try:
    result = subprocess.run(
        ["node", "scripts/gmb-manual-assist.js", "--auto"],
        env=env,
        capture_output=True,
        text=True,
        cwd="/var/www/homeopathy-business-platform"
    )
    print("Exit Code:", result.returncode)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print("Execution failed:", e)
