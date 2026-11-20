// UI strings (EN / VI) and locale-aware number formatting.
// Vietnamese wording follows GDPT-2018 terms (chu kì, nhóm, khối, phi kim, ...); to be reviewed by moony.
const EN = {
  'app.title': 'Periodic Table 3D', 'app.sub': 'real data · real shapes',
  'view.table': 'Table', 'view.atom': 'Atom', 'view.sample': 'Sample', 'view.trends': 'Trends', 'view.compare': 'Compare', 'view.quiz': 'Quiz',
  'prop.rCov': 'Atom size (covalent radius)', 'prop.rVdw': 'Atom size (van der Waals radius)', 'prop.ie1': 'First ionization energy', 'prop.en': 'Electronegativity (Pauling)',
  'prop.ea': 'Electron affinity', 'prop.mp': 'Melting point', 'prop.bp': 'Boiling point', 'prop.density': 'Density', 'prop.aw': 'Atomic weight',
  'prop.abund': "Abundance in Earth's crust", 'prop.year': 'Year discovered', 'prop.zeff': 'Effective nuclear charge (outer electron)',
  'why.rCov': 'Across a period each extra proton pulls the outer shell in, so atoms shrink; going down a group adds a whole new shell, so atoms grow.',
  'why.rVdw': 'How close two atoms can come without bonding. It grows down a group as the electron cloud gets bigger.',
  'why.ie1': 'Small atoms hold their outer electron tightly, so removing it costs more energy: it rises across a period and falls down a group.',
  'why.en': 'How hard an atom pulls on the electrons it shares in a bond. Small atoms with nearly full shells pull hardest.',
  'why.ea': 'Energy released when an atom grabs one extra electron. Atoms one electron short of a full shell grab hardest.',
  'why.mp': 'Strong bonds between atoms need more heat to break apart, so the melting point tracks bond strength.',
  'why.bp': 'Boiling pulls the atoms completely apart, so it needs even more energy than melting.',
  'why.density': 'Heavy atoms packed tightly make a dense solid; gases are a thousand times less dense than solids.',
  'why.aw': 'Almost all the mass sits in the protons and neutrons, so it climbs steadily with the proton number.',
  'why.abund': 'Elements were made in stars and sorted by the Earth: light elements are common, heavy ones are rare (log scale!).',
  'why.year': 'Common metals were known in ancient times; the newest elements were made a few atoms at a time in accelerators.',
  'why.zeff': 'Inner electrons shield the nucleus, so an outer electron feels less than the full charge. That felt charge climbs across each period.',
  'cat.alkali': 'Alkali metal', 'cat.alkaline-earth': 'Alkaline earth metal', 'cat.transition': 'Transition metal', 'cat.post-transition': 'Post-transition metal',
  'cat.metalloid': 'Metalloid', 'cat.nonmetal': 'Reactive nonmetal', 'cat.halogen': 'Halogen', 'cat.noble-gas': 'Noble gas', 'cat.lanthanide': 'Lanthanide', 'cat.actinide': 'Actinide',
  'state.solid': 'solid', 'state.liquid': 'liquid', 'state.gas': 'gas', 'state.unknown': 'unknown',
  'nat.natural': 'occurs in nature', 'nat.trace': 'in nature only in traces', 'nat.synthetic': 'synthetic (made by people)',
  'block': 'Block', 'group': 'Group', 'period': 'Period',
  'f.Z': 'Atomic number (protons)', 'f.aw': 'Standard atomic weight', 'f.massNumber': 'Mass number, longest-lived isotope', 'f.config': 'Electron configuration',
  'f.term': 'Ground term', 'f.state': 'State at 20 °C', 'f.mp': 'Melting point', 'f.bp': 'Boiling point', 'f.sub': 'Sublimes at (1 atm)', 'f.density': 'Density',
  'f.en': 'Electronegativity (Pauling)', 'f.ie1': '1st ionization energy', 'f.ie2': '2nd ionization energy', 'f.ie3': '3rd ionization energy', 'f.ea': 'Electron affinity',
  'f.rCov': 'Covalent radius', 'f.rVdw': 'van der Waals radius', 'f.ox': 'Oxidation states', 'f.crystal': 'Crystal structure', 'f.latticeText': 'Lattice constants',
  'f.abund': "Abundance in Earth's crust", 'f.year': 'Discovered', 'f.discoverers': 'Discovered by', 'f.natural': 'In nature?', 'f.nStable': 'Stable isotopes',
  'f.isoMain': 'Most common isotope', 'f.halfLife': 'Longest half-life', 'f.rNuc': 'Nuclear radius (charge)', 'f.zeff': 'Effective nuclear charge',
  'f.lines': 'Visible emission lines', 'f.cat': 'Family', 'f.place': 'Place in the table', 'f.madelung': 'Filling order',
  'ancient': 'ancient times', 'lines.count': '{n} lines (showing {k})', 'lines.none': 'none in 380–750 nm',
  'madelung.exception': 'exception: {d}', 'madelung.follows': 'follows the usual order',
  'ctl.title': 'Controls', 'ctl.height': 'Column height', 'ctl.log': 'Log scale', 'ctl.layout': 'Layout', 'lay.s18': '18 columns', 'lay.s32': '32 columns', 'lay.helix': 'Helix',
  'ctl.color': 'Colour', 'col.cat': 'Family', 'col.state': 'State at T', 'ctl.temp': 'Temperature', 'ctl.room': 'room temperature',
  'lg.title': 'Legend & filters', 'lg.ghost': 'No data (ghost column)', 'lg.hatch': 'Predicted / estimated value', 'lg.dim': 'Filtered out', 'lg.reset': 'Show all',
  'flt.block': 'Block', 'flt.group': 'Group', 'flt.period': 'Period', 'flt.state': 'State at T', 'flt.origin': 'Origin', 'any': 'any',
  'search.ph': 'Search name, symbol or number', 'search.none': 'No match', 'search.label': 'Search elements',
  'sh.more': 'More details', 'sh.less': 'Fewer details', 'sh.atom': 'See its atom', 'sh.sample': 'See a sample', 'sh.compare': 'Compare', 'sh.prev': 'Previous element',
  'sh.next': 'Next element', 'sh.close': 'Close', 'sh.tap': 'Tap any value to see its source.', 'sh.data': 'Data',
  'src.source': 'Source', 'src.accessed': 'Accessed', 'src.licence': 'Licence', 'src.note': 'Note', 'src.other': 'Other sources say', 'src.pred': 'Predicted or estimated, not measured.',
  'src.th': 'Theoretical or semi-empirical value (NIST notation).', 'src.unc': 'Uncertainty', 'src.ref': 'NIST reference code', 'src.placeholder': 'Unverified placeholder: waiting for a source (see QUESTIONS.md).',
  'src.none': 'No value in our sources', 'src.open': 'Open source page',
  'hint.table': 'Drag to turn · scroll or pinch to zoom · tap a column', 'tip.nodata': 'no data',
  'set.title': 'Settings', 'set.quality': 'Quality', 'q.auto': 'Auto', 'q.low': 'Low', 'q.med': 'Medium', 'q.high': 'High', 'set.motion': 'Reduce motion',
  'set.cb': 'Colour-blind palette', 'set.fps': 'FPS meter', 'set.lang': 'Language', 'set.share': 'Copy link to this view', 'set.copied': 'Link copied',
  'set.tierNow': 'now: {tier}',
  'help.title': 'How to use', 'cr.title': 'Sources & credits', 'btn.help': 'Help', 'btn.credits': 'Sources', 'btn.settings': 'Settings', 'btn.lang': 'Tiếng Việt',
  'btn.controls': 'Controls', 'btn.legend': 'Legend', 'btn.data': 'Data',
  'help.body': [
    'Each column is one element, in order of its number of protons. Pick what the height shows: size, ionization energy, melting point and more.',
    'Colours show the family; a ghost column means no data; a striped column means the value is predicted, not measured.',
    'Tap a column for its data sheet. Tap any number in the sheet to see exactly where it comes from.',
  ],
  'help.keys': 'Keys', 'key.prevnext': 'previous / next element', 'key.updown': 'up / down the column', 'key.views': 'switch view', 'key.search': 'search',
  'key.layout': 'change layout', 'key.height': 'change column height', 'key.esc': 'close panels', 'key.enter': 'open the atom', 'key.fps': 'FPS meter',
  'cr.intro': 'Every number in this page comes from a public source and carries a source tag: tap a value to see it. Descriptions are our own words.',
  'cr.inspired': "Inspired by Ryan Sael's 3D periodic table (sael.net/periodic-table). Our own design and code.",
  'cr.three': 'Rendering: three.js r{v} (MIT licence), inlined. No fonts, images or models: every shape is made in code.',
  'cr.build': 'Built {date} from commit {commit}.', 'cr.sources': 'Data sources', 'cr.th.name': 'Source', 'cr.th.used': 'Used for', 'cr.th.lic': 'Licence', 'cr.th.date': 'Accessed',
  'cr.placeholders': 'Values marked "unverified" are placeholders waiting for a source.',
  'sum.protons': '{name} has {Z} protons in its nucleus.', 'sum.neutrons': ' The most common kind also has {N} neutrons.',
  'sum.state': ' At room temperature (20 °C) it is a {state}.', 'sum.stateP': ' At room temperature (20 °C) it would probably be a {state} (predicted).',
  'sum.melts': ' It melts at {mp} and boils at {bp}.', 'sum.meltsOnly': ' It melts at {mp}.', 'sum.sublimes': ' At normal pressure it never melts: it turns straight into gas at {sub}.',
  'sum.nosolid': ' Even near absolute zero it stays liquid at normal pressure; it boils at {bp}.',
  'sum.family': ' It is a {cat} in group {g}, period {p}.', 'sum.familyF': ' It is a {cat} in period {p} (the f-block).',
  'sum.exception': ' Its electrons break the usual filling order.', 'sum.fewAtoms': ' Only a few atoms have ever been made, so many numbers here are predictions.',
  'atom.title': 'Atom of {name}', 'atom.protons': 'Protons', 'atom.neutrons': 'Neutrons', 'atom.electrons': 'Electrons', 'atom.outer': 'Outer shell',
  'atom.mode.orbital': 'Orbitals', 'atom.mode.total': 'All electrons', 'atom.config': 'Electron configuration (tap one)', 'atom.orbitals': 'Orbitals in {sub}',
  'atom.all': 'all', 'atom.boxes': 'Electrons in {sub} (one per box first, then pairs: Hund\'s rule)',
  'atom.nodes': '{name}: {r} round node(s) and {a} flat or cone-shaped node(s), where the electron is never found. Orange and blue are the + and − parts of the wave.',
  'atom.surface': 'Show the 90 % surface', 'atom.surfaceLow': 'needs Medium or High quality', 'atom.stepper': 'Add a proton', 'atom.addP': '+ proton', 'atom.remP': '− proton',
  'atom.newE': 'The new electron goes into {sub}.', 'atom.lostE': 'An electron leaves {sub}.',
  'atom.rearr': 'Surprise: the electrons rearrange ({d}). This element breaks the usual filling order.',
  'atom.approx': 'Shapes are hydrogen-like orbitals with an effective nuclear charge Z_eff = {z} ({src}): a good picture, but an approximation for atoms with many electrons.',
  'atom.nucleus': 'nucleus', 'atom.nucleusX': 'nucleus, drawn ×{x}', 'atom.scale': 'The nucleus is really about {r} fm across the radius, so here it is drawn about {x} times bigger than it truly is. Everything else is to scale.',
  'atom.totalWhat': 'Every dot marks a place where an electron could be. Inner shells sit tight around the nucleus; the outer shell sets the size of the atom.',
  'atom.l0': 's subshells', 'atom.l1': 'p subshells', 'atom.l2': 'd subshells', 'atom.l3': 'f subshells',
  'spec.title': 'Visible light it gives off (NIST lines)', 'spec.glow': 'glow ≈', 'spec.glowWhat': 'approximate colour of a glowing gas of this element, from these lines',
  'spec.none': 'NIST lists no visible lines for this atom.', 'spec.tap': 'Tap a line to see its wavelength.', 'spec.rel': 'relative intensity',
  'spec.basisGA': 'NIST gives no intensities for this atom: heights use transition probabilities.',
  'unit.K': 'K',
};

const VI = {
  'app.title': 'Bảng tuần hoàn 3D', 'app.sub': 'số liệu thật · hình dạng thật',
  'view.table': 'Bảng', 'view.atom': 'Nguyên tử', 'view.sample': 'Mẫu chất', 'view.trends': 'Xu hướng', 'view.compare': 'So sánh', 'view.quiz': 'Đố vui',
  'prop.rCov': 'Kích thước nguyên tử (bán kính cộng hoá trị)', 'prop.rVdw': 'Kích thước nguyên tử (bán kính van der Waals)', 'prop.ie1': 'Năng lượng ion hoá thứ nhất',
  'prop.en': 'Độ âm điện (Pauling)', 'prop.ea': 'Ái lực electron', 'prop.mp': 'Nhiệt độ nóng chảy', 'prop.bp': 'Nhiệt độ sôi', 'prop.density': 'Khối lượng riêng',
  'prop.aw': 'Nguyên tử khối', 'prop.abund': 'Độ phổ biến trong vỏ Trái Đất', 'prop.year': 'Năm phát hiện', 'prop.zeff': 'Điện tích hạt nhân hiệu dụng (electron ngoài cùng)',
  'why.rCov': 'Trong một chu kì, mỗi proton thêm vào kéo lớp electron ngoài cùng lại gần hơn nên nguyên tử nhỏ dần; đi xuống một nhóm thì có thêm một lớp electron nên nguyên tử to dần.',
  'why.rVdw': 'Khoảng cách gần nhất mà hai nguyên tử có thể chạm nhau khi không liên kết. Tăng dần khi đi xuống nhóm vì đám mây electron lớn hơn.',
  'why.ie1': 'Nguyên tử nhỏ giữ chặt electron ngoài cùng nên cần nhiều năng lượng hơn để tách nó: tăng dần trong chu kì, giảm dần khi đi xuống nhóm.',
  'why.en': 'Mức độ nguyên tử hút cặp electron dùng chung trong liên kết. Nguyên tử nhỏ, lớp ngoài gần đầy hút mạnh nhất.',
  'why.ea': 'Năng lượng toả ra khi nguyên tử nhận thêm một electron. Nguyên tử chỉ thiếu một electron là đầy lớp sẽ nhận mạnh nhất.',
  'why.mp': 'Liên kết giữa các nguyên tử càng bền thì càng cần nhiều nhiệt để phá vỡ, nên nhiệt độ nóng chảy phản ánh độ bền liên kết.',
  'why.bp': 'Khi sôi, các nguyên tử bị tách hẳn ra xa nhau, nên cần nhiều năng lượng hơn cả khi nóng chảy.',
  'why.density': 'Nguyên tử nặng xếp khít nhau tạo thành chất rắn đặc; chất khí nhẹ hơn chất rắn khoảng một nghìn lần.',
  'why.aw': 'Gần như toàn bộ khối lượng nằm ở proton và neutron, nên nó tăng đều theo số proton.',
  'why.abund': 'Các nguyên tố được tạo ra trong các ngôi sao rồi được Trái Đất phân bố lại: nguyên tố nhẹ thì phổ biến, nguyên tố nặng thì hiếm (thang log!).',
  'why.year': 'Các kim loại thông dụng đã được biết từ thời cổ đại; những nguyên tố mới nhất được tạo ra từng vài nguyên tử một trong máy gia tốc.',
  'why.zeff': 'Các electron bên trong che chắn hạt nhân, nên electron ngoài cùng chỉ cảm nhận được một phần điện tích. Phần điện tích đó tăng dần trong mỗi chu kì.',
  'cat.alkali': 'Kim loại kiềm', 'cat.alkaline-earth': 'Kim loại kiềm thổ', 'cat.transition': 'Kim loại chuyển tiếp', 'cat.post-transition': 'Kim loại sau chuyển tiếp',
  'cat.metalloid': 'Á kim', 'cat.nonmetal': 'Phi kim hoạt động', 'cat.halogen': 'Halogen', 'cat.noble-gas': 'Khí hiếm', 'cat.lanthanide': 'Họ lanthanide', 'cat.actinide': 'Họ actinide',
  'state.solid': 'chất rắn', 'state.liquid': 'chất lỏng', 'state.gas': 'chất khí', 'state.unknown': 'chưa rõ',
  'nat.natural': 'có trong tự nhiên', 'nat.trace': 'chỉ có vết trong tự nhiên', 'nat.synthetic': 'nhân tạo (do con người tạo ra)',
  'block': 'Khối', 'group': 'Nhóm', 'period': 'Chu kì',
  'f.Z': 'Số hiệu nguyên tử (số proton)', 'f.aw': 'Nguyên tử khối chuẩn', 'f.massNumber': 'Số khối, đồng vị sống lâu nhất', 'f.config': 'Cấu hình electron',
  'f.term': 'Số hạng cơ bản', 'f.state': 'Trạng thái ở 20 °C', 'f.mp': 'Nhiệt độ nóng chảy', 'f.bp': 'Nhiệt độ sôi', 'f.sub': 'Thăng hoa ở (1 atm)', 'f.density': 'Khối lượng riêng',
  'f.en': 'Độ âm điện (Pauling)', 'f.ie1': 'Năng lượng ion hoá thứ nhất', 'f.ie2': 'Năng lượng ion hoá thứ hai', 'f.ie3': 'Năng lượng ion hoá thứ ba', 'f.ea': 'Ái lực electron',
  'f.rCov': 'Bán kính cộng hoá trị', 'f.rVdw': 'Bán kính van der Waals', 'f.ox': 'Số oxi hoá', 'f.crystal': 'Cấu trúc tinh thể', 'f.latticeText': 'Hằng số mạng',
  'f.abund': 'Độ phổ biến trong vỏ Trái Đất', 'f.year': 'Năm phát hiện', 'f.discoverers': 'Người phát hiện', 'f.natural': 'Trong tự nhiên?', 'f.nStable': 'Số đồng vị bền',
  'f.isoMain': 'Đồng vị phổ biến nhất', 'f.halfLife': 'Chu kì bán rã dài nhất', 'f.rNuc': 'Bán kính hạt nhân (điện tích)', 'f.zeff': 'Điện tích hạt nhân hiệu dụng',
  'f.lines': 'Vạch phát xạ nhìn thấy', 'f.cat': 'Loại', 'f.place': 'Vị trí trong bảng', 'f.madelung': 'Thứ tự điền electron',
  'ancient': 'thời cổ đại', 'lines.count': '{n} vạch (hiển thị {k})', 'lines.none': 'không có trong 380–750 nm',
  'madelung.exception': 'ngoại lệ: {d}', 'madelung.follows': 'theo đúng thứ tự thông thường',
  'ctl.title': 'Điều khiển', 'ctl.height': 'Chiều cao cột', 'ctl.log': 'Thang log', 'ctl.layout': 'Cách xếp', 'lay.s18': '18 cột', 'lay.s32': '32 cột', 'lay.helix': 'Xoắn ốc',
  'ctl.color': 'Màu', 'col.cat': 'Loại', 'col.state': 'Trạng thái ở T', 'ctl.temp': 'Nhiệt độ', 'ctl.room': 'nhiệt độ phòng',
  'lg.title': 'Chú giải & bộ lọc', 'lg.ghost': 'Không có số liệu (cột mờ)', 'lg.hatch': 'Giá trị dự đoán / ước tính', 'lg.dim': 'Bị lọc ra', 'lg.reset': 'Hiện tất cả',
  'flt.block': 'Khối', 'flt.group': 'Nhóm', 'flt.period': 'Chu kì', 'flt.state': 'Trạng thái ở T', 'flt.origin': 'Nguồn gốc', 'any': 'tất cả',
  'search.ph': 'Tìm tên, kí hiệu hoặc số hiệu', 'search.none': 'Không tìm thấy', 'search.label': 'Tìm nguyên tố',
  'sh.more': 'Thêm chi tiết', 'sh.less': 'Bớt chi tiết', 'sh.atom': 'Xem nguyên tử', 'sh.sample': 'Xem mẫu chất', 'sh.compare': 'So sánh', 'sh.prev': 'Nguyên tố trước',
  'sh.next': 'Nguyên tố sau', 'sh.close': 'Đóng', 'sh.tap': 'Chạm vào một số liệu để xem nguồn.', 'sh.data': 'Số liệu',
  'src.source': 'Nguồn', 'src.accessed': 'Ngày truy cập', 'src.licence': 'Giấy phép', 'src.note': 'Ghi chú', 'src.other': 'Nguồn khác ghi', 'src.pred': 'Giá trị dự đoán hoặc ước tính, chưa đo được.',
  'src.th': 'Giá trị lí thuyết hoặc bán thực nghiệm (kí hiệu của NIST).', 'src.unc': 'Độ bất định', 'src.ref': 'Mã tài liệu NIST', 'src.placeholder': 'Giá trị tạm, chưa kiểm chứng: đang chờ nguồn (xem QUESTIONS.md).',
  'src.none': 'Không có trong nguồn dữ liệu', 'src.open': 'Mở trang nguồn',
  'hint.table': 'Kéo để xoay · cuộn hoặc chụm hai ngón để phóng to · chạm vào một cột', 'tip.nodata': 'không có số liệu',
  'set.title': 'Cài đặt', 'set.quality': 'Chất lượng', 'q.auto': 'Tự động', 'q.low': 'Thấp', 'q.med': 'Vừa', 'q.high': 'Cao', 'set.motion': 'Giảm chuyển động',
  'set.cb': 'Bảng màu cho người mù màu', 'set.fps': 'Đồng hồ FPS', 'set.lang': 'Ngôn ngữ', 'set.share': 'Sao chép liên kết tới màn hình này', 'set.copied': 'Đã sao chép liên kết',
  'set.tierNow': 'hiện tại: {tier}',
  'help.title': 'Cách dùng', 'cr.title': 'Nguồn & ghi công', 'btn.help': 'Trợ giúp', 'btn.credits': 'Nguồn', 'btn.settings': 'Cài đặt', 'btn.lang': 'English',
  'btn.controls': 'Điều khiển', 'btn.legend': 'Chú giải', 'btn.data': 'Số liệu',
  'help.body': [
    'Mỗi cột là một nguyên tố, xếp theo số proton. Chọn đại lượng cho chiều cao cột: kích thước, năng lượng ion hoá, nhiệt độ nóng chảy và nhiều hơn nữa.',
    'Màu cho biết loại nguyên tố; cột mờ nghĩa là không có số liệu; cột kẻ sọc nghĩa là giá trị được dự đoán, chưa đo được.',
    'Chạm vào một cột để xem bảng số liệu. Chạm vào bất kì số nào để biết chính xác nó lấy từ đâu.',
  ],
  'help.keys': 'Phím tắt', 'key.prevnext': 'nguyên tố trước / sau', 'key.updown': 'lên / xuống trong cột', 'key.views': 'đổi chế độ xem', 'key.search': 'tìm kiếm',
  'key.layout': 'đổi cách xếp', 'key.height': 'đổi chiều cao cột', 'key.esc': 'đóng bảng', 'key.enter': 'mở nguyên tử', 'key.fps': 'đồng hồ FPS',
  'cr.intro': 'Mọi con số trên trang này đều lấy từ nguồn công khai và có ghi nguồn: chạm vào số liệu để xem. Phần mô tả do chúng tôi tự viết.',
  'cr.inspired': 'Lấy cảm hứng từ bảng tuần hoàn 3D của Ryan Sael (sael.net/periodic-table). Thiết kế và mã nguồn là của chúng tôi.',
  'cr.three': 'Hiển thị 3D: three.js r{v} (giấy phép MIT), nhúng sẵn. Không dùng phông chữ, hình ảnh hay mô hình: mọi hình đều được tạo bằng mã.',
  'cr.build': 'Bản dựng ngày {date}, commit {commit}.', 'cr.sources': 'Nguồn dữ liệu', 'cr.th.name': 'Nguồn', 'cr.th.used': 'Dùng cho', 'cr.th.lic': 'Giấy phép', 'cr.th.date': 'Truy cập',
  'cr.placeholders': 'Giá trị ghi "chưa kiểm chứng" là giá trị tạm đang chờ nguồn.',
  'sum.protons': '{name} có {Z} proton trong hạt nhân.', 'sum.neutrons': ' Loại phổ biến nhất còn có {N} neutron.',
  'sum.state': ' Ở nhiệt độ phòng (20 °C), nó là {state}.', 'sum.stateP': ' Ở nhiệt độ phòng (20 °C), có lẽ nó là {state} (dự đoán).',
  'sum.melts': ' Nó nóng chảy ở {mp} và sôi ở {bp}.', 'sum.meltsOnly': ' Nó nóng chảy ở {mp}.', 'sum.sublimes': ' Ở áp suất thường nó không nóng chảy mà thăng hoa thẳng thành khí ở {sub}.',
  'sum.nosolid': ' Ở áp suất thường, kể cả gần độ không tuyệt đối nó vẫn là chất lỏng; nó sôi ở {bp}.',
  'sum.family': ' Nó thuộc loại {cat}, ở nhóm {g}, chu kì {p}.', 'sum.familyF': ' Nó thuộc loại {cat}, ở chu kì {p} (khối f).',
  'sum.exception': ' Các electron của nó không điền theo thứ tự thông thường.', 'sum.fewAtoms': ' Người ta mới chỉ tạo ra được vài nguyên tử, nên nhiều số liệu ở đây là dự đoán.',
  'atom.title': 'Nguyên tử {name}', 'atom.protons': 'Proton', 'atom.neutrons': 'Neutron', 'atom.electrons': 'Electron', 'atom.outer': 'Lớp ngoài cùng',
  'atom.mode.orbital': 'Orbital', 'atom.mode.total': 'Tất cả electron', 'atom.config': 'Cấu hình electron (chạm để chọn)', 'atom.orbitals': 'Các orbital {sub}',
  'atom.all': 'tất cả', 'atom.boxes': 'Electron trong {sub} (mỗi ô một electron trước rồi mới ghép đôi: quy tắc Hund)',
  'atom.nodes': '{name}: {r} mặt nút hình cầu và {a} mặt nút phẳng hoặc hình nón, nơi không bao giờ có electron. Màu cam và xanh là phần dấu + và − của sóng.',
  'atom.surface': 'Hiện mặt bao 90 %', 'atom.surfaceLow': 'cần chất lượng Vừa hoặc Cao', 'atom.stepper': 'Thêm một proton', 'atom.addP': '+ proton', 'atom.remP': '− proton',
  'atom.newE': 'Electron mới đi vào {sub}.', 'atom.lostE': 'Một electron rời khỏi {sub}.',
  'atom.rearr': 'Bất ngờ: các electron sắp xếp lại ({d}). Nguyên tố này không theo thứ tự điền thông thường.',
  'atom.approx': 'Hình dạng là orbital kiểu nguyên tử hydrogen với điện tích hạt nhân hiệu dụng Z_eff = {z} ({src}): hình ảnh tốt nhưng chỉ gần đúng cho nguyên tử nhiều electron.',
  'atom.nucleus': 'hạt nhân', 'atom.nucleusX': 'hạt nhân, vẽ to ×{x}', 'atom.scale': 'Bán kính thật của hạt nhân chỉ khoảng {r} fm, nên ở đây nó được vẽ to hơn thật khoảng {x} lần. Mọi thứ khác đúng tỉ lệ.',
  'atom.totalWhat': 'Mỗi chấm là một nơi electron có thể có mặt. Các lớp bên trong nằm sát hạt nhân; lớp ngoài cùng quyết định kích thước nguyên tử.',
  'atom.l0': 'phân lớp s', 'atom.l1': 'phân lớp p', 'atom.l2': 'phân lớp d', 'atom.l3': 'phân lớp f',
  'spec.title': 'Ánh sáng nhìn thấy nó phát ra (vạch NIST)', 'spec.glow': 'màu phát sáng ≈', 'spec.glowWhat': 'màu gần đúng của khí nguyên tố này khi phát sáng, tính từ các vạch này',
  'spec.none': 'NIST không có vạch nhìn thấy nào của nguyên tử này.', 'spec.tap': 'Chạm vào một vạch để xem bước sóng.', 'spec.rel': 'cường độ tương đối',
  'spec.basisGA': 'NIST không cho cường độ của nguyên tử này: chiều cao vạch dùng xác suất chuyển dời.',
  'unit.K': 'K',
};

export const STRINGS = { en: EN, vi: VI };
let lang = 'en';
export const getLang = () => lang;
export function setLang(l) { lang = l === 'vi' ? 'vi' : 'en'; document.documentElement.lang = lang; }
export function t(key, params) {
  let s = STRINGS[lang][key] ?? EN[key] ?? key;
  if (params && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
  return s;
}
const nfCache = new Map();
/** Locale number formatting: VI uses a decimal comma and dot thousands separator. */
export function fmtNum(v, maxDigits = 3, { minDigits = 0, sig = null } = {}) {
  if (v == null || Number.isNaN(v)) return '—';
  const key = `${lang}|${maxDigits}|${minDigits}|${sig}`;
  let nf = nfCache.get(key);
  if (!nf) {
    const opt = sig ? { maximumSignificantDigits: sig } : { maximumFractionDigits: maxDigits, minimumFractionDigits: minDigits };
    nf = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', opt);
    nfCache.set(key, nf);
  }
  return nf.format(v);
}
/** Very small or large numbers in scientific form: 1.2 × 10⁻⁵ */
export function fmtSci(v, sig = 3) {
  if (v == null) return '—';
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e >= -3 && e < 6) return fmtNum(v, Math.max(0, sig - 1 - e));
  const m = v / 10 ** e;
  const sup = String(e).split('').map(c => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]).join('');
  return `${fmtNum(m, sig - 1)} × 10${sup}`;
}
export const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
