# Jireh — media bundler.
#
# Downloads every piece of the app's artwork (portraits, videos, all 27
# medallions) into app/assets/media so it ships INSIDE the app instead
# of streaming from the internet. Run from the app folder:
#
#   powershell -ExecutionPolicy Bypass -File scripts\fetch-media.ps1
#
# Then commit:  git add assets ; git commit -m "Bundle media" ; git push

$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "..\assets\media"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function Get-Media($url, $name) {
    $out = Join-Path $dir $name
    Write-Host "  $name"
    Invoke-WebRequest $url -OutFile $out
}

Write-Host "Portraits and videos..."
Get-Media "https://cdn.openart.ai/openart-ai/production/2026-08/create-image/JZMxRtTkpmFe2dgMdSQI/image_1787807279541_3c4d75bb_1787807280769_4f5443ba.png" "portrait.png"
Get-Media "https://galaxy-prod.tlcdn.com/gen/debef90d4b77451384e73d6955aab448.mp4" "portrait-loop.mp4"
Get-Media "https://galaxy-prod.tlcdn.com/gen/6a7bd948424440198d0ea1eb0ab950ca.png" "praying.png"
Get-Media "https://galaxy-prod.tlcdn.com/gen/c40483a9d15140b4a6997c3a9190a631.mp4" "praying-loop.mp4"

Write-Host "Badge medallions..."
Get-Media "https://g.tlcdn.com/gen/3785b1ad19964d7c8f776b37b08906f7.jpg" "m-first-light.jpg"
Get-Media "https://g.tlcdn.com/gen/f23ffd37849a40ed804f5ad88e30a32d.jpg" "m-three-days.jpg"
Get-Media "https://g.tlcdn.com/gen/b0240c9e99bd4d0aab49c4fd91137dcb.jpg" "m-week-grace.jpg"
Get-Media "https://g.tlcdn.com/gen/c6a24d91076746dc83bc798961fde8da.jpg" "m-faithful-month.jpg"
Get-Media "https://g.tlcdn.com/gen/e45cd724154245a1ab491298659e2263.jpg" "m-hundredfold.jpg"
Get-Media "https://g.tlcdn.com/gen/57f34edf7d4b4c71b4ad31b071ed8a72.jpg" "m-praying-hands.jpg"
Get-Media "https://g.tlcdn.com/gen/99aba283bd044799928edc29737d805b.jpg" "m-prayer-warrior.jpg"
Get-Media "https://g.tlcdn.com/gen/2e9b055af0804805bbfa8d9419944d1f.jpg" "m-intercessor.jpg"
Get-Media "https://g.tlcdn.com/gen/5cc2b56e28c844349873faf89c290846.jpg" "m-book.jpg"
Get-Media "https://g.tlcdn.com/gen/aff3257657fa43a5a0ed5d61672c5f55.jpg" "m-scripture-seeker.jpg"
Get-Media "https://g.tlcdn.com/gen/2252fe9935f442faafe543b0b38e23f5.jpg" "m-deep-in-word.jpg"
Get-Media "https://g.tlcdn.com/gen/b2c39fe1ea414a669a9ada319b517b97.jpg" "m-first-story.jpg"
Get-Media "https://g.tlcdn.com/gen/c332d29dfcbf4aa7885a0732f853f621.jpg" "m-story-lover.jpg"
Get-Media "https://g.tlcdn.com/gen/b7d416c44d014530b89509221faa4515.jpg" "m-lamp-stand.jpg"
Get-Media "https://g.tlcdn.com/gen/463e725d316f414ca8f5a02d680f76fa.jpg" "m-city-hill.jpg"
Get-Media "https://g.tlcdn.com/gen/339a1ad2e2a74c64bd8a2d9c4aeae637.jpg" "m-salt-light.jpg"
Get-Media "https://g.tlcdn.com/gen/d509a396a98949b08b116e6844fe42e8.jpg" "m-dove.jpg"

Write-Host "Story medallions..."
Get-Media "https://g.tlcdn.com/gen/721dff69351842afbb6590271f8d5620.jpg" "s-david.jpg"
Get-Media "https://g.tlcdn.com/gen/9b36428081044649b5951e7fff2fc649.jpg" "s-nativity.jpg"
Get-Media "https://g.tlcdn.com/gen/4d3623c4acfb4f3dba19a00bf58423b8.jpg" "s-resurrection.jpg"
Get-Media "https://g.tlcdn.com/gen/1f2f51e55be9451085df14b7408ebf9b.jpg" "s-noah.jpg"
Get-Media "https://g.tlcdn.com/gen/62f00aabf4a14804a95a2afb73e881b4.jpg" "s-exodus.jpg"
Get-Media "https://g.tlcdn.com/gen/c0015747e48345e0827ded2500e761c1.jpg" "s-daniel.jpg"
Get-Media "https://g.tlcdn.com/gen/e4cd7aa3bda042a9bc4d472ac92887be.jpg" "s-jonah.jpg"
Get-Media "https://g.tlcdn.com/gen/34e6a66e7fbf4d9ca97375162c6e2d55.jpg" "s-prodigal.jpg"
Get-Media "https://g.tlcdn.com/gen/e3994a1fb3f44586b31a0c8f9c5d5968.jpg" "s-creation.jpg"
Get-Media "https://g.tlcdn.com/gen/81f4f79ca7c04fdcb026a7fb5c3bdf57.jpg" "s-esther.jpg"

Write-Host ""
Write-Host "All media downloaded to assets\media."
Write-Host "Now run:  git add assets ; git commit -m `"Bundle media`" ; git push"

Write-Host "Faithfulness medallions..."
Get-Media "https://g.tlcdn.com/gen/13b84e0b9f6b4b05a72572920e43f2ca.jpg" "m-faithful-weeks.jpg"
Get-Media "https://g.tlcdn.com/gen/0ed9637d9fcc42e39c6b8821de542d40.jpg" "m-season-faithful.jpg"
