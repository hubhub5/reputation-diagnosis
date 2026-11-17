"""픽셀아트 GIF 생성기.

48x48 캔버스에 그리고 4배로 키운다. 팔레트는 사이트 토큰과 같은 5색.
라이트(name.gif)와 다크(name-d.gif) 두 벌을 만든다.
실행: python3 scripts/pixel/make_gifs.py
"""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "public" / "px"
OUT.mkdir(parents=True, exist_ok=True)

W = H = 48
SCALE = 4
BG, INK, MUTE, LINE, ACC = 0, 1, 2, 3, 4
PAL = {
    "": [(0xFF, 0xFF, 0xFF), (0x1A, 0x1A, 0x1A), (0x8C, 0x8C, 0x88), (0xD2, 0xD2, 0xCC), (0xF2, 0xC3, 0x00)],
    "-d": [(0x18, 0x18, 0x17), (0xEB, 0xEB, 0xE6), (0x85, 0x85, 0x7F), (0x3A, 0x3A, 0x37), (0xF2, 0xC3, 0x00)],
}


class Frame:
    def __init__(self):
        self.p = [[BG] * W for _ in range(H)]

    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.p[y][x] = c

    def fill(self, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.px(i, j, c)

    def box(self, x, y, w, h, c, fill=None):
        if fill is not None:
            self.fill(x, y, w, h, fill)
        for i in range(x, x + w):
            self.px(i, y, c)
            self.px(i, y + h - 1, c)
        for j in range(y, y + h):
            self.px(x, j, c)
            self.px(x + w - 1, j, c)

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.px(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy


def save(name, frames, durations):
    for suffix, pal in PAL.items():
        flat = [v for rgb in pal for v in rgb] + [0] * (768 - len(pal) * 3)
        imgs = []
        for f in frames:
            im = Image.new("P", (W, H))
            im.putpalette(flat)
            im.putdata([c for row in f.p for c in row])
            imgs.append(im.resize((W * SCALE, H * SCALE), Image.NEAREST))
        imgs[0].save(
            OUT / f"{name}{suffix}.gif", save_all=True, append_images=imgs[1:],
            duration=durations, loop=0, optimize=False, disposal=1,
        )
    print("ok", name, len(frames), "frames")


def person(f, x, y, c=INK):
    """3x7 사람. (x, y) = 머리 왼쪽 위."""
    f.fill(x, y, 3, 3, c)
    f.fill(x, y + 3, 3, 3, c)
    f.px(x, y + 6, c)
    f.px(x + 2, y + 6, c)


def paper(f, x, y, w=8, h=10):
    f.box(x, y, w, h, INK, fill=BG)
    for j in range(y + 2, y + h - 2, 2):
        f.fill(x + 2, j, w - 4, 1, MUTE)


# 1. 회의실 문: 서류는 문 앞에 멈추고, 이름표만 문틈으로 들어간다
def door():
    frames, dur = [], []
    for t in range(18):
        f = Frame()
        f.fill(0, 42, W, 1, LINE)
        f.box(28, 8, 14, 34, INK, fill=BG)
        f.fill(30, 10, 10, 30, LINE)
        f.px(38, 26, INK)
        f.px(38, 25, INK)
        f.fill(31, 5, 8, 2, ACC if t % 6 < 4 else LINE)  # 회의 중 표시
        dx = min(t, 7) * 2
        paper(f, 4 + dx, 31)
        tag_x = 9 + dx
        if t < 9:
            f.fill(tag_x, 37, 5, 3, ACC)
        elif t < 15:
            tx = 23 + (t - 9) * 3
            if tx < 28:
                f.fill(tx, 39, 5, 3, ACC)
            elif tx < 36:
                f.fill(tx, 41, 5, 1, ACC)
        frames.append(f)
        dur.append(900 if t in (8, 17) else 110)
    save("door", frames, dur)


# 2. 저울: 자기평가(검정)와 타인평가(노랑) 사이를 오간다
def scale():
    seq = [0, 1, 2, 3, 3, 3, 2, 1, 0, -1, -2, -2, -2, -1, 0, 0]
    frames, dur = [], []
    for tilt in seq:
        f = Frame()
        f.fill(23, 12, 2, 28, INK)
        f.fill(16, 40, 16, 2, INK)
        f.fill(22, 9, 4, 3, INK)
        lx, ly, rx, ry = 6, 12 - tilt * 2, 41, 12 + tilt * 2
        f.line(lx, ly, rx, ry, INK)
        f.line(lx, ly + 1, rx, ry + 1, INK)
        for (x, y, c) in ((lx, ly, INK), (rx, ry, ACC)):
            f.line(x, y + 1, x - 4, y + 12, MUTE)
            f.line(x, y + 1, x + 4, y + 12, MUTE)
            f.fill(x - 6, y + 12, 13, 2, INK)
            f.fill(x - 3, y + 8, 7, 4, c)
        frames.append(f)
        dur.append(500 if tilt in (3, -2) else 120)
    save("scale", frames, dur)


# 3. 말풍선: 한 줄씩 채워지고 마지막 줄에 밑줄
def bubble():
    rows = [(12, 26), (17, 22), (22, 16)]
    frames, dur = [], []
    total = sum(n for _, n in rows)
    steps = list(range(0, total + 1, 4)) + [total] * 6
    for k, s in enumerate(steps):
        f = Frame()
        f.box(5, 6, 38, 26, INK, fill=BG)
        f.fill(12, 32, 1, 5, INK)
        f.line(12, 36, 18, 31, INK)
        f.fill(13, 31, 5, 1, BG)
        left = s
        for (y, n) in rows:
            m = max(0, min(n, left))
            for i in range(0, m, 2):
                f.px(10 + i, y, INK)
                f.px(11 + i, y, INK)
            left -= n
        if s >= total:
            f.fill(10, 25, 16, 1, ACC)
            if k % 2 == 0:
                f.fill(28, 21, 1, 3, INK)
        else:
            f.fill(10 + (s % 26), 28, 1, 1, MUTE)
        person(f, 34, 38)
        frames.append(f)
        dur.append(140 if s < total else 260)
    save("bubble", frames, dur)


# 4. 계단: 한 칸 오르고 다음 칸 앞에서 멈칫
def stairs():
    steps = [(4, 40), (14, 33), (24, 26), (34, 19)]
    path = [(1, 0), (1, 0), (1, -1), (2, -2), (2, 0), (2, 0), (2, 0), (2, -1), (2, 0), (2, 0), (2, 0)]
    frames, dur = [], []
    for t, (si, hop) in enumerate(path):
        f = Frame()
        for i, (x, y) in enumerate(steps):
            f.fill(x, y, 48 - x, 1, INK)
            f.fill(x, y, 1, 7 if i else 8, INK)
        f.fill(4, 47, 44, 1, INK)
        f.fill(41, 9, 1, 10, INK)
        f.fill(42, 9, 5, 4, ACC)
        x, y = steps[si]
        person(f, x + 4, y - 7 + hop)
        if t in (7, 8):
            f.px(x + 9, y - 9, MUTE)
            f.px(x + 9, y - 11, MUTE)
        frames.append(f)
        dur.append(700 if t in (4, 10) else 150)
    save("stairs", frames, dur)


# 5. 모래시계
def hourglass():
    frames, dur = [], []
    N = 10
    for t in range(N + 2):
        f = Frame()
        f.fill(12, 6, 24, 2, INK)
        f.fill(12, 40, 24, 2, INK)
        f.line(15, 8, 23, 23, INK)
        f.line(32, 8, 24, 23, INK)
        f.line(15, 39, 23, 24, INK)
        f.line(32, 39, 24, 24, INK)
        k = min(t, N)
        # 위쪽 모래: 목(y=22)부터 위로 (N-k)+2 줄
        for j in range(N - k + 2):
            y = 22 - j
            half = (23 - y) * 8 // 15
            if half >= 1:
                f.fill(24 - half + 1, y, 2 * half - 1, 1, ACC)
            else:
                f.px(24, y, ACC)
        # 아래쪽 모래: 바닥부터 쌓이는 언덕
        for j in range(k + 2):
            y = 38 - j
            half = (39 - y) * 8 // 15
            w = min(16 - 2 * (j // 2), 2 * (8 - half) - 2)
            if w > 0:
                f.fill(24 - w // 2, y, w, 1, ACC)
        if t < N:
            f.fill(24, 24, 1, 14 - k, ACC if t % 2 else MUTE)
        frames.append(f)
        dur.append(600 if t >= N else 160)
    save("hourglass", frames, dur)


# 6. 봉투: 문서가 들어가고 덮개가 닫히면 노란 점
def envelope():
    frames, dur = [], []
    for t in range(14):
        f = Frame()
        doc_y = min(4 + t * 3, 22)
        if t < 7:
            paper(f, 16, doc_y, 16, 18)
        f.box(8, 22, 32, 20, INK, fill=BG)
        f.line(8, 41, 22, 31, LINE)
        f.line(39, 41, 25, 31, LINE)
        if t < 7:
            f.line(8, 22, 23, 12, INK)
            f.line(39, 22, 24, 12, INK)
        else:
            f.line(8, 22, 23, 33, INK)
            f.line(39, 22, 24, 33, INK)
        if t >= 9:
            on = t % 2 == 1 or t == 13
            f.fill(22, 31, 4, 4, ACC if on else LINE)
        frames.append(f)
        dur.append(900 if t == 13 else 120)
    save("envelope", frames, dur)


# 7. 달력: 커서가 칸을 지나다 한 칸에 표시
def calendar():
    cells = [(c, r) for r in range(4) for c in range(5)]
    target = 12
    seq = list(range(0, target + 1)) + [target] * 6
    frames, dur = [], []
    for t, cur in enumerate(seq):
        f = Frame()
        f.box(4, 8, 40, 36, INK, fill=BG)
        f.fill(4, 8, 40, 6, INK)
        f.fill(12, 5, 2, 6, MUTE)
        f.fill(34, 5, 2, 6, MUTE)
        for i, (c, r) in enumerate(cells):
            x, y = 7 + c * 7, 17 + r * 6
            if i == cur and t < target:
                f.box(x - 1, y - 1, 6, 5, INK)
            if i == target and t >= target:
                f.fill(x - 1, y - 1, 6, 5, ACC)
                if t >= target + 2:
                    f.px(x + 1, y + 2, INK)
                    f.px(x + 2, y + 3, INK)
                    f.line(x + 3, y + 2, x + 4, y + 0, INK)
            elif i < cur or i > target:
                f.fill(x + 1, y + 1, 2, 1, LINE)
            else:
                f.fill(x + 1, y + 1, 2, 1, MUTE)
        frames.append(f)
        dur.append(1000 if t == len(seq) - 1 else 110)
    save("calendar", frames, dur)


# 8. 이름표: 이름 칸이 한 글자씩 진해진다
def nametag():
    frames, dur = [], []
    for t in range(12):
        f = Frame()
        f.line(17, 2, 22, 12, MUTE)
        f.line(31, 2, 26, 12, MUTE)
        f.fill(21, 12, 6, 3, INK)
        f.box(8, 15, 32, 26, INK, fill=BG)
        f.fill(8, 15, 32, 6, INK)
        f.fill(21, 17, 6, 2, BG)
        for i in range(4):
            c = INK if i < min(t, 4) else LINE
            f.fill(12 + i * 6, 25, 4, 6, c)
        f.fill(12, 35, 14, 1, MUTE)
        if t >= 5:
            f.fill(32, 34, 4, 4, ACC if t % 2 else BG)
        frames.append(f)
        dur.append(800 if t == 11 else 200)
    save("nametag", frames, dur)


# 9. 생각: 머리 위 생각 구름의 꼬인 선이 곧은 선으로 풀린다
def think():
    frames, dur = [], []
    for t in range(14):
        f = Frame()
        # 옆얼굴
        f.box(6, 26, 14, 14, INK, fill=BG)
        f.fill(19, 32, 2, 2, INK)
        f.fill(9, 40, 8, 6, INK)
        f.px(15, 30, INK)
        # 올라가는 작은 원
        if t % 4 >= 1:
            f.fill(21, 23, 2, 2, MUTE)
        if t % 4 >= 2:
            f.fill(24, 19, 3, 3, MUTE)
        # 생각 구름
        f.box(22, 3, 24, 15, INK, fill=BG)
        if t < 7:
            ys = [8, 11, 7, 12, 9, 6, 11, 10, 8]
            pts = [(25 + i * 2, ys[(i + t) % len(ys)]) for i in range(9)]
            for a, b in zip(pts, pts[1:]):
                f.line(a[0], a[1], b[0], b[1], MUTE)
        else:
            f.fill(25, 9, 17, 1, INK)
            f.fill(25, 12, 10, 1, INK)
            if t >= 9:
                f.fill(38, 11, 3, 3, ACC)
        frames.append(f)
        dur.append(900 if t == 13 else 160)
    save("think", frames, dur)


if __name__ == "__main__":
    for fn in (door, scale, bubble, stairs, hourglass, envelope, calendar, nametag, think):
        fn()
