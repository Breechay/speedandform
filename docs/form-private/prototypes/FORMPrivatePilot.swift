// ─────────────────────────────────────────────────────────────────────────────
// FORMPrivatePilot.swift
// FORM Private — Pilot Build
//
// Scope: brutally narrow. One curator instrument. One member flow.
// Testing interaction grammar, not building the company.
//
// What's in here:
//   Design System   — colors, type, spacing, shared components
//   Models          — Drop, Member, Rsvp (minimal)
//   Stores          — DropStore, MemberStore (with UserDefaults persistence)
//   Curator Surface — Drops list, Create Drop, Drop Detail + headcount
//   Member Surface  — Quiet → Drop → Respond → Gate → Declined
//
// What's deliberately NOT here:
//   Stewardship CRM, member archive, post-event evaluation,
//   roster filters, governance UI, vouching tiers.
//   All deferred. Not needed to test interaction grammar.
//
// Cursor: split by // MARK: when ready.
// ─────────────────────────────────────────────────────────────────────────────

import SwiftUI

// MARK: - App Entry

@main
struct FORMPrivatePilotApp: App {
    @StateObject private var dropStore   = DropStore()
    @StateObject private var memberStore = MemberStore()
    @AppStorage("isCuratorMode") private var isCuratorMode = true

    var body: some Scene {
        WindowGroup {
            RootView(isCuratorMode: $isCuratorMode)
                .environmentObject(dropStore)
                .environmentObject(memberStore)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Design System
// ─────────────────────────────────────────────────────────────────────────────

extension Color {
    init(h: String) {
        let s = h.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var n: UInt64 = 0
        Scanner(string: s).scanHexInt64(&n)
        self.init(
            red:   Double((n >> 16) & 0xFF) / 255,
            green: Double((n >>  8) & 0xFF) / 255,
            blue:  Double( n        & 0xFF) / 255
        )
    }

    // Warm parchment palette
    static let fpBg       = Color(h: "#F0EDE6")
    static let fpSurface  = Color(h: "#FAFAF7")
    static let fpWhite    = Color.white
    static let fpInk      = Color(h: "#1A1710")
    static let fpInk2     = Color(h: "#2E2A22")
    static let fpMuted    = Color(h: "#6B6358")
    static let fpDim      = Color(h: "#9E978C")
    static let fpXdim     = Color(h: "#C8C2B8")
    static let fpLine     = Color(h: "#DDD9D0")
    static let fpGreen    = Color(h: "#2D6645")
    static let fpGreenBg  = Color(h: "#EBF4EE")
    static let fpAmber    = Color(h: "#7A5E28")
    static let fpAmberBg  = Color(h: "#F5EFDF")
    static let fpRed      = Color(h: "#8A3C2E")

    // Dark hero palette
    static let fpDark     = Color(h: "#0D0B09")
    static let fpDarkMid  = Color(h: "#1A1710")
    static let fpHero     = Color(h: "#F5F2EC")
}

struct DS { // Design System constants
    // Typography
    static func serif(_ size: CGFloat, italic: Bool = false) -> Font {
        italic
            ? .custom("Georgia-Italic", size: size)
            : .custom("Georgia", size: size)
    }
    static func body(_ size: CGFloat = 15, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }
    static func label(_ size: CGFloat = 11) -> Font {
        .system(size: size, weight: .semibold)
    }

    // Spacing
    static let xs: CGFloat  =  4
    static let sm: CGFloat  =  8
    static let md: CGFloat  = 16
    static let lg: CGFloat  = 24
    static let xl: CGFloat  = 32
    static let sh: CGFloat  = 20   // screen horizontal padding
    static let sb: CGFloat  = 48   // screen bottom padding
}

// MARK: Shared components

struct FPRule: View {
    var body: some View { Rectangle().fill(Color.fpLine).frame(height: 1) }
}

struct FPEyebrow: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(DS.label(10))
            .tracking(2)
            .foregroundColor(.fpDim)
    }
}

struct FPPill: View {
    let text: String; let fg: Color; let bg: Color
    var body: some View {
        Text(text)
            .font(DS.label(11))
            .foregroundColor(fg)
            .padding(.horizontal, 10).padding(.vertical, 4)
            .background(bg).clipShape(Capsule())
            .overlay(Capsule().stroke(fg.opacity(0.2), lineWidth: 1))
    }
}

struct FPField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var keyboard: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(DS.label(10)).tracking(1).foregroundColor(.fpDim)
            TextField(placeholder, text: $text)
                .font(DS.body(15)).foregroundColor(.fpInk)
                .keyboardType(keyboard)
                .padding(12)
                .background(Color.fpSurface)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color.fpLine, lineWidth: 1))
        }
    }
}

struct MemberAvatar: View {
    let initials: String
    var size: CGFloat = 36
    var bg: Color = .fpBg
    var fg: Color = .fpMuted
    var border: Color = .fpLine

    var body: some View {
        ZStack {
            Circle().fill(bg)
            Text(initials)
                .font(.system(size: size * 0.33, weight: .semibold))
                .foregroundColor(fg)
        }
        .frame(width: size, height: size)
        .overlay(Circle().stroke(border, lineWidth: 1))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Models
// ─────────────────────────────────────────────────────────────────────────────

struct FPDrop: Identifiable, Codable {
    var id            = UUID()
    var title         : String
    var occasion      : String
    var date          : Date
    var timeWindow    : String
    var location      : String
    var classType     : DropClass
    var costType      : CostType
    var costAmount    : Double?
    var depositAmount : Double?
    var capacity      : Int?
    var rsvpDeadline  : Date
    var status        : Status
    var venueConfirmed: Bool = false
    var curatorNote   : String = ""

    enum DropClass: String, Codable, CaseIterable {
        case a = "A — High commitment"
        case b = "B — Low friction"
        var isA: Bool { self == .a }
    }
    enum CostType: String, Codable, CaseIterable {
        case free = "No cost"
        case estimate = "Estimate"
        case fixed = "Fixed"
    }
    enum Status: String, Codable {
        case draft, live, completed, cancelled
        var label: String { rawValue.capitalized }
    }

    var costLabel: String {
        switch costType {
        case .free:     return "No cost"
        case .estimate: return "~$\(Int(costAmount ?? 0)) est."
        case .fixed:    return "$\(Int(costAmount ?? 0)) fixed"
        }
    }
    var dateLabel: String {
        let f = DateFormatter(); f.dateFormat = "EEEE, MMMM d"
        return f.string(from: date)
    }
    var deadlineLabel: String {
        let f = DateFormatter(); f.dateFormat = "MMM d"
        return "RSVP by \(f.string(from: rsvpDeadline))"
    }
}

struct FPRsvp: Identifiable, Codable {
    var id             = UUID()
    var dropId         : UUID
    var memberId       : UUID
    var response       : Response
    var plusOneName    : String?
    var depositPaid    : Bool = false
    var timestamp      = Date()

    enum Response: String, Codable {
        case confirmed, declined, waitlisted
    }
}

struct FPMember: Identifiable, Codable {
    var id        = UUID()
    var firstName : String
    var lastName  : String
    var note      : String = ""  // private curator note only

    var displayName: String { "\(firstName) \(lastName)" }
    var initials: String {
        "\(firstName.prefix(1))\(lastName.prefix(1))".uppercased()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Stores (with UserDefaults persistence)
// ─────────────────────────────────────────────────────────────────────────────

final class DropStore: ObservableObject {
    @Published var drops: [FPDrop] = [] {
        didSet { save() }
    }
    @Published var rsvps: [FPRsvp] = [] {
        didSet { saveRsvps() }
    }

    init() { load() }

    func confirmed(for drop: FPDrop) -> [FPRsvp] {
        rsvps.filter { $0.dropId == drop.id && $0.response == .confirmed }
    }
    func confirmedCount(for drop: FPDrop) -> Int { confirmed(for: drop).count }

    func respond(dropId: UUID, memberId: UUID, response: FPRsvp.Response, plusOne: String? = nil) {
        if let i = rsvps.firstIndex(where: { $0.dropId == dropId && $0.memberId == memberId }) {
            rsvps[i].response = response
            rsvps[i].plusOneName = plusOne
        } else {
            rsvps.append(FPRsvp(dropId: dropId, memberId: memberId,
                               response: response, plusOneName: plusOne))
        }
    }

    func markDepositPaid(rsvpId: UUID) {
        if let i = rsvps.firstIndex(where: { $0.id == rsvpId }) {
            rsvps[i].depositPaid = true
        }
    }

    var liveDrops: [FPDrop] {
        drops.filter { $0.status == .live }.sorted { $0.date < $1.date }
    }

    private func save() {
        if let d = try? JSONEncoder().encode(drops) {
            UserDefaults.standard.set(d, forKey: "fp_drops")
        }
    }
    private func saveRsvps() {
        if let d = try? JSONEncoder().encode(rsvps) {
            UserDefaults.standard.set(d, forKey: "fp_rsvps")
        }
    }
    private func load() {
        if let d = UserDefaults.standard.data(forKey: "fp_drops"),
           let decoded = try? JSONDecoder().decode([FPDrop].self, from: d) {
            drops = decoded
        }
        if let d = UserDefaults.standard.data(forKey: "fp_rsvps"),
           let decoded = try? JSONDecoder().decode([FPRsvp].self, from: d) {
            rsvps = decoded
        }
    }
}

final class MemberStore: ObservableObject {
    @Published var members: [FPMember] = [] {
        didSet { save() }
    }

    init() { load() }

    func member(id: UUID) -> FPMember? { members.first { $0.id == id } }

    private func save() {
        if let d = try? JSONEncoder().encode(members) {
            UserDefaults.standard.set(d, forKey: "fp_members")
        }
    }
    private func load() {
        if let d = UserDefaults.standard.data(forKey: "fp_members"),
           let decoded = try? JSONDecoder().decode([FPMember].self, from: d) {
            members = decoded
        } else {
            // Seed with village sample data on first launch
            members = FPMember.pilotSeed
        }
    }
}

extension FPMember {
    static let pilotSeed: [FPMember] = [
        FPMember(firstName: "Marcus",  lastName: "B."),
        FPMember(firstName: "Lara",    lastName: "F."),
        FPMember(firstName: "Chloe",   lastName: "B."),
        FPMember(firstName: "Andrea",  lastName: "A."),
        FPMember(firstName: "Paola",   lastName: "D."),
        FPMember(firstName: "Emily",   lastName: "K."),
        FPMember(firstName: "Tinius",  lastName: "S."),
        FPMember(firstName: "Hayden",  lastName: "P."),
        FPMember(firstName: "Milos",   lastName: "V."),
        FPMember(firstName: "Sam",     lastName: "P."),
    ]
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Root (Mode Switch: Curator ↔ Member)
// ─────────────────────────────────────────────────────────────────────────────

struct RootView: View {
    @Binding var isCuratorMode: Bool
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            if isCuratorMode {
                CuratorRootView()
            } else {
                MemberRootView()
            }

            // Pilot mode toggle — remove before real launch
            Button {
                isCuratorMode.toggle()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: isCuratorMode ? "iphone" : "square.grid.2x2")
                        .font(.system(size: 12, weight: .semibold))
                    Text(isCuratorMode ? "Member view" : "Curator")
                        .font(DS.label(11))
                }
                .foregroundColor(.fpMuted)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(Color.fpSurface.opacity(0.95))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.fpLine, lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 2)
            }
            .buttonStyle(.plain)
            .padding(.trailing, 20)
            .padding(.bottom, 100)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - CURATOR SURFACE
// ─────────────────────────────────────────────────────────────────────────────

struct CuratorRootView: View {
    var body: some View {
        TabView {
            CuratorDropsView()
                .tabItem { Label("Drops", systemImage: "circle.dotted") }
            CuratorRosterView()
                .tabItem { Label("Village", systemImage: "person.2") }
        }
        .tint(.fpInk)
    }
}

// MARK: Curator — Drops List

struct CuratorDropsView: View {
    @EnvironmentObject var dropStore: DropStore
    @State private var showCreate = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    VStack(alignment: .leading, spacing: 6) {
                        FPEyebrow(text: "FORM Private")
                        Text("Drops")
                            .font(DS.serif(34))
                            .foregroundColor(.fpInk)
                        Text("Venue confirmed before the Drop goes out.")
                            .font(DS.body(14))
                            .foregroundColor(.fpMuted)
                    }
                    .padding(.horizontal, DS.sh)
                    .padding(.top, DS.lg)
                    .padding(.bottom, DS.md)

                    FPRule()

                    if dropStore.drops.isEmpty {
                        VStack(spacing: DS.md) {
                            Image(systemName: "circle.dotted")
                                .font(.system(size: 40))
                                .foregroundColor(.fpXdim)
                            Text("No drops yet.")
                                .font(DS.serif(20))
                                .foregroundColor(.fpDim)
                            Text("Create one when the venue is confirmed.")
                                .font(DS.body(14))
                                .foregroundColor(.fpXdim)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, DS.xl * 2)
                    } else {
                        VStack(spacing: DS.sm) {
                            ForEach(dropStore.drops.sorted { $0.date < $1.date }) { drop in
                                NavigationLink {
                                    CuratorDropDetailView(drop: drop)
                                } label: {
                                    CuratorDropCard(drop: drop)
                                }
                                .buttonStyle(.plain)
                                .padding(.horizontal, DS.sh)
                            }
                        }
                        .padding(.vertical, DS.md)
                    }

                    Spacer(minLength: DS.sb)
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreate = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.fpInk)
                    }
                }
            }
            .sheet(isPresented: $showCreate) {
                CreateDropView().environmentObject(dropStore)
            }
        }
    }
}

struct CuratorDropCard: View {
    let drop: FPDrop
    @EnvironmentObject var dropStore: DropStore

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    FPEyebrow(text: drop.dateLabel)
                    Text(drop.title)
                        .font(DS.serif(19))
                        .foregroundColor(drop.status == .live ? .fpInk : .fpMuted)
                        .lineLimit(2)
                }
                Spacer()
                statusPill
            }
            .padding(.horizontal, DS.md)
            .padding(.top, DS.md)
            .padding(.bottom, DS.sm)

            FPRule()

            HStack {
                Label(drop.location, systemImage: "mappin")
                    .font(DS.body(13))
                    .foregroundColor(.fpMuted)
                    .lineLimit(1)
                Spacer()
                Text(drop.costLabel)
                    .font(DS.body(13, weight: .medium))
                    .foregroundColor(.fpInk2)
            }
            .padding(.horizontal, DS.md)
            .padding(.vertical, DS.sm)

            FPRule()

            HStack {
                let count = dropStore.confirmedCount(for: drop)
                let cap = drop.capacity ?? 0
                Text("\(count)\(cap > 0 ? "/\(cap)" : "") confirmed")
                    .font(DS.body(12))
                    .foregroundColor(.fpDim)
                Spacer()
                if !drop.venueConfirmed {
                    Label("Venue not confirmed", systemImage: "exclamationmark.triangle.fill")
                        .font(DS.body(11))
                        .foregroundColor(.fpAmber)
                } else {
                    Text(drop.deadlineLabel)
                        .font(DS.body(12))
                        .foregroundColor(.fpDim)
                }
            }
            .padding(.horizontal, DS.md)
            .padding(.vertical, DS.sm)
        }
        .background(drop.status == .live ? Color.fpWhite : Color.fpSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(Color.fpLine, lineWidth: 1))
    }

    private var statusPill: some View {
        Group {
            switch drop.status {
            case .live:      FPPill(text: "Live",      fg: .fpGreen,  bg: .fpGreenBg)
            case .draft:     FPPill(text: "Draft",     fg: .fpDim,    bg: .fpSurface)
            case .completed: FPPill(text: "Done",      fg: .fpMuted,  bg: .fpSurface)
            case .cancelled: FPPill(text: "Cancelled", fg: .fpRed,    bg: Color(h: "#F5ECEA"))
            }
        }
    }
}

// MARK: Curator — Drop Detail

struct CuratorDropDetailView: View {
    let drop: FPDrop
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore
    @State private var showNote = false
    @State private var noteText = ""

    var confirmed: [FPRsvp] { dropStore.confirmed(for: drop) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                // Hero block
                VStack(alignment: .leading, spacing: 4) {
                    FPEyebrow(text: drop.dateLabel)
                        .padding(.bottom, 2)
                    Text(drop.title)
                        .font(DS.serif(30))
                        .foregroundColor(.fpInk)
                    Text(drop.occasion)
                        .font(DS.body(15).italic())
                        .foregroundColor(.fpMuted)
                        .padding(.top, 2)
                }
                .padding(.horizontal, DS.sh)
                .padding(.top, DS.lg)
                .padding(.bottom, DS.md)

                FPRule()

                // Info rows
                infoRow("Time",      drop.timeWindow)
                FPRule()
                infoRow("Location",  drop.location)
                FPRule()
                infoRow("Class",     "Class \(drop.classType.rawValue.prefix(1))",
                        valueColor: drop.classType.isA ? .fpAmber : .fpGreen)
                FPRule()
                infoRow("Cost",      drop.costLabel)
                if let dep = drop.depositAmount {
                    FPRule()
                    infoRow("Deposit", "$\(Int(dep)) per person", valueColor: .fpAmber)
                }
                FPRule()
                infoRow("Venue confirmed",
                        drop.venueConfirmed ? "Yes ✓" : "Not yet",
                        valueColor: drop.venueConfirmed ? .fpGreen : .fpRed)

                FPRule()

                // Headcount
                VStack(alignment: .leading, spacing: DS.md) {
                    HStack {
                        FPEyebrow(text: "Headcount")
                        Spacer()
                        Text("\(confirmed.count) confirmed")
                            .font(DS.body(13, weight: .semibold))
                            .foregroundColor(.fpGreen)
                    }

                    if confirmed.isEmpty {
                        Text("No confirmations yet.")
                            .font(DS.body(14))
                            .foregroundColor(.fpDim)
                            .italic()
                    } else {
                        ForEach(confirmed) { rsvp in
                            HStack(spacing: DS.md) {
                                if let member = memberStore.member(id: rsvp.memberId) {
                                    MemberAvatar(initials: member.initials)
                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(member.displayName)
                                            .font(DS.body(14, weight: .medium))
                                            .foregroundColor(.fpInk)
                                        if let plus = rsvp.plusOneName, !plus.isEmpty {
                                            Text("+ \(plus)")
                                                .font(DS.body(12))
                                                .foregroundColor(.fpMuted)
                                        }
                                    }
                                    Spacer()
                                    // Deposit toggle
                                    if drop.classType.isA {
                                        Button {
                                            dropStore.markDepositPaid(rsvpId: rsvp.id)
                                        } label: {
                                            Image(systemName: rsvp.depositPaid
                                                  ? "checkmark.circle.fill"
                                                  : "circle")
                                            .foregroundColor(rsvp.depositPaid ? .fpGreen : .fpXdim)
                                            .font(.system(size: 20))
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, DS.sh)
                .padding(.vertical, DS.md)

                FPRule()

                // Quick note
                VStack(alignment: .leading, spacing: DS.sm) {
                    FPEyebrow(text: "Curator note")
                    Text(drop.curatorNote.isEmpty
                         ? "No note yet. Log what you observed."
                         : drop.curatorNote)
                        .font(DS.body(14))
                        .foregroundColor(drop.curatorNote.isEmpty ? .fpXdim : .fpInk2)
                        .italic()
                        .lineSpacing(3)

                    Button {
                        noteText = drop.curatorNote
                        showNote = true
                    } label: {
                        Text(drop.curatorNote.isEmpty ? "Add note" : "Edit note")
                            .font(DS.body(13))
                            .foregroundColor(.fpAccent)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, DS.sh)
                .padding(.vertical, DS.md)

                Spacer(minLength: DS.sb)
            }
        }
        .background(Color.fpBg.ignoresSafeArea())
        .navigationTitle(drop.title)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showNote) {
            QuickNoteSheet(text: $noteText) { saved in
                if let i = dropStore.drops.firstIndex(where: { $0.id == drop.id }) {
                    dropStore.drops[i].curatorNote = saved
                }
            }
        }
    }

    private func infoRow(_ label: String, _ value: String, valueColor: Color = .fpInk2) -> some View {
        HStack {
            Text(label).font(DS.body(14)).foregroundColor(.fpMuted)
            Spacer()
            Text(value).font(DS.body(14, weight: .medium)).foregroundColor(valueColor)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, DS.sh)
        .padding(.vertical, 13)
    }
}

// MARK: Quick Note Sheet

struct QuickNoteSheet: View {
    @Binding var text: String
    let onSave: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: DS.md) {
                Text("Write it while it's fresh.")
                    .font(DS.serif(22))
                    .foregroundColor(.fpInk)
                Text("Energy. Dynamics. Anything worth remembering.")
                    .font(DS.body(14))
                    .foregroundColor(.fpMuted)

                TextEditor(text: $text)
                    .font(DS.body(15))
                    .foregroundColor(.fpInk)
                    .frame(minHeight: 160)
                    .padding(DS.sm)
                    .background(Color.fpSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(Color.fpLine, lineWidth: 1))

                Spacer()

                Button {
                    onSave(text)
                    dismiss()
                } label: {
                    Text("Save note")
                        .font(DS.body(15, weight: .semibold))
                        .foregroundColor(.fpHero)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 17)
                        .background(Color.fpInk)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, DS.sh)
            .padding(.top, DS.md)
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("Note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }.foregroundColor(.fpMuted)
                }
            }
        }
    }
}

// MARK: Create Drop

struct CreateDropView: View {
    @EnvironmentObject var dropStore: DropStore
    @Environment(\.dismiss) private var dismiss

    @State private var title          = ""
    @State private var occasion       = ""
    @State private var date           = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
    @State private var timeWindow     = "6 – 10 pm"
    @State private var location       = ""
    @State private var classType      = FPDrop.DropClass.b
    @State private var costType       = FPDrop.CostType.free
    @State private var costAmount     = ""
    @State private var depositAmount  = ""
    @State private var capacity       = ""
    @State private var rsvpDeadline   = Calendar.current.date(byAdding: .day, value: 4, to: Date())!
    @State private var venueConfirmed = false

    private var canPublish: Bool {
        !title.isEmpty && !location.isEmpty && venueConfirmed
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    // Cardinal rule warning
                    if !venueConfirmed {
                        HStack(alignment: .top, spacing: DS.sm) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.fpAmber)
                                .padding(.top, 1)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Venue not confirmed")
                                    .font(DS.body(13, weight: .semibold))
                                    .foregroundColor(.fpAmber)
                                Text("You cannot publish until venue terms are confirmed in writing. This is the cardinal rule.")
                                    .font(DS.body(12))
                                    .foregroundColor(.fpAmber.opacity(0.8))
                                    .lineSpacing(3)
                            }
                        }
                        .padding(DS.md)
                        .background(Color.fpAmberBg)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .padding(.horizontal, DS.sh)
                        .padding(.top, DS.md)
                    }

                    section("The occasion") {
                        FPField(label: "Title", text: $title, placeholder: "Sunday at the River")
                        FPField(label: "Vibe", text: $occasion, placeholder: "Afternoon into evening. Music.")
                        FPField(label: "Location", text: $location, placeholder: "Casa Neos · Miami River")
                        FPField(label: "Time window", text: $timeWindow, placeholder: "5 – 9 pm")
                    }

                    FPRule()

                    section("When") {
                        DatePicker("Date", selection: $date, displayedComponents: .date)
                            .font(DS.body(15)).foregroundColor(.fpInk)
                        DatePicker("RSVP deadline", selection: $rsvpDeadline, displayedComponents: .date)
                            .font(DS.body(15)).foregroundColor(.fpInk)
                    }

                    FPRule()

                    section("Format") {
                        VStack(alignment: .leading, spacing: DS.sm) {
                            Text("Class")
                                .font(DS.label(10)).tracking(1).foregroundColor(.fpDim)
                            Picker("Class", selection: $classType) {
                                ForEach(FPDrop.DropClass.allCases, id: \.self) {
                                    Text($0 == .a ? "Class A" : "Class B").tag($0)
                                }
                            }
                            .pickerStyle(.segmented)
                            Text(classType.isA
                                 ? "High commitment — deposits, hard RSVP, venue minimum."
                                 : "Low friction — soft RSVP, no deposit, informal.")
                                .font(DS.body(12)).foregroundColor(.fpDim)
                        }

                        VStack(alignment: .leading, spacing: DS.sm) {
                            Text("Cost")
                                .font(DS.label(10)).tracking(1).foregroundColor(.fpDim)
                            Picker("Cost", selection: $costType) {
                                ForEach(FPDrop.CostType.allCases, id: \.self) {
                                    Text($0.rawValue).tag($0)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        if costType != .free {
                            FPField(label: "Amount ($)", text: $costAmount,
                                    placeholder: "55", keyboard: .decimalPad)
                        }
                        if classType.isA {
                            FPField(label: "Deposit ($)", text: $depositAmount,
                                    placeholder: "20", keyboard: .decimalPad)
                        }
                        FPField(label: "Capacity (optional)", text: $capacity,
                                placeholder: "24", keyboard: .numberPad)
                    }

                    FPRule()

                    section("Venue confirmation") {
                        VStack(alignment: .leading, spacing: DS.sm) {
                            Text("Venue terms must be confirmed in writing — WhatsApp, email, anything — before this drop goes out. The difference between confirmed and informal is $30,000.")
                                .font(DS.body(13)).foregroundColor(.fpMuted).lineSpacing(3)

                            Toggle(isOn: $venueConfirmed) {
                                Text("Terms confirmed in writing")
                                    .font(DS.body(15, weight: .medium))
                                    .foregroundColor(.fpInk)
                            }
                            .tint(.fpGreen)
                        }
                    }

                    FPRule()

                    VStack(spacing: DS.sm) {
                        Button { publish(.live) } label: {
                            Text("Publish Drop")
                                .font(DS.body(15, weight: .semibold))
                                .foregroundColor(canPublish ? .fpHero : .fpXdim)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 17)
                                .background(canPublish ? Color.fpInk : Color.fpLine)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .disabled(!canPublish)
                        .buttonStyle(.plain)

                        Button { publish(.draft) } label: {
                            Text("Save as draft")
                                .font(DS.body(15))
                                .foregroundColor(.fpMuted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, DS.sh)
                    .padding(.vertical, DS.md)

                    Spacer(minLength: DS.sb)
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("New Drop")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }.foregroundColor(.fpMuted)
                }
            }
        }
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: DS.md) {
            FPEyebrow(text: title)
            content()
        }
        .padding(.horizontal, DS.sh)
        .padding(.vertical, DS.md)
    }

    private func publish(_ status: FPDrop.Status) {
        let drop = FPDrop(
            title: title.isEmpty ? "Untitled" : title,
            occasion: occasion,
            date: date,
            timeWindow: timeWindow,
            location: location,
            classType: classType,
            costType: costType,
            costAmount: Double(costAmount),
            depositAmount: Double(depositAmount),
            capacity: Int(capacity),
            rsvpDeadline: rsvpDeadline,
            status: status,
            venueConfirmed: venueConfirmed
        )
        dropStore.drops.insert(drop, at: 0)
        dismiss()
    }
}

// MARK: Curator — Village (simple roster, pilot only)

struct CuratorRosterView: View {
    @EnvironmentObject var memberStore: MemberStore
    @State private var showAdd = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(memberStore.members) { member in
                    HStack(spacing: DS.md) {
                        MemberAvatar(initials: member.initials)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(member.displayName)
                                .font(DS.body(15, weight: .medium))
                                .foregroundColor(.fpInk)
                            if !member.note.isEmpty {
                                Text(member.note)
                                    .font(DS.body(12))
                                    .foregroundColor(.fpDim)
                                    .lineLimit(1)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                .onDelete { indexSet in
                    memberStore.members.remove(atOffsets: indexSet)
                }
            }
            .listStyle(.plain)
            .background(Color.fpBg)
            .scrollContentBackground(.hidden)
            .navigationTitle("Village")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus").foregroundColor(.fpInk)
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Text("\(memberStore.members.count) members")
                        .font(DS.body(13))
                        .foregroundColor(.fpDim)
                }
            }
            .sheet(isPresented: $showAdd) {
                AddMemberSheet().environmentObject(memberStore)
            }
        }
    }
}

struct AddMemberSheet: View {
    @EnvironmentObject var memberStore: MemberStore
    @Environment(\.dismiss) private var dismiss
    @State private var first = ""
    @State private var last  = ""
    @State private var note  = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: DS.md) {
                FPField(label: "First name", text: $first, placeholder: "First")
                FPField(label: "Last name",  text: $last,  placeholder: "Last")
                FPField(label: "Private note (optional)", text: $note, placeholder: "Vouched by Marcus. Good energy.")
                Spacer()
                Button {
                    memberStore.members.append(
                        FPMember(firstName: first, lastName: last, note: note)
                    )
                    dismiss()
                } label: {
                    Text("Add to village")
                        .font(DS.body(15, weight: .semibold))
                        .foregroundColor(.fpHero)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 17)
                        .background(first.isEmpty ? Color.fpLine : Color.fpInk)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .disabled(first.isEmpty)
                .buttonStyle(.plain)
            }
            .padding(.horizontal, DS.sh)
            .padding(.top, DS.md)
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("Add member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }.foregroundColor(.fpMuted)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - MEMBER SURFACE (Drop → Respond → Gate)
// ─────────────────────────────────────────────────────────────────────────────

// MARK: Member Session

final class MemberSession: ObservableObject {
    enum State { case viewing, responding, confirmed, declined }
    @Published var state: State = .viewing
    @Published var plusOneName: String = ""

    func beginRespond() { withAnimation(.easeInOut(duration: 0.2)) { state = .responding } }
    func confirm(plusOne: String = "") {
        plusOneName = plusOne
        withAnimation(.spring(response: 0.45, dampingFraction: 0.82)) { state = .confirmed }
    }
    func decline() {
        withAnimation(.easeInOut(duration: 0.2)) { state = .declined }
    }
    func reset() {
        withAnimation(.easeInOut(duration: 0.2)) {
            state = .viewing
            plusOneName = ""
        }
    }
}

struct MemberRootView: View {
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore
    @StateObject private var session  = MemberSession()

    // In production: member identity comes from auth / device token
    // For pilot: use first member in roster
    var currentMember: FPMember? { memberStore.members.first }
    var activeDrop: FPDrop?     { dropStore.liveDrops.first }

    // Who from the village is going (excluding self)
    var circleGoing: [FPMember] {
        guard let drop = activeDrop else { return [] }
        return dropStore.confirmed(for: drop)
            .compactMap { rsvp in memberStore.member(id: rsvp.memberId) }
            .filter { $0.id != currentMember?.id }
            .prefix(6)
            .map { $0 }
    }

    var body: some View {
        Group {
            if let drop = activeDrop {
                switch session.state {
                case .viewing:
                    MemberDropScreen(drop: drop, circleGoing: circleGoing)
                        .environmentObject(session)
                case .responding:
                    MemberRespondScreen(drop: drop)
                        .environmentObject(session)
                        .environmentObject(dropStore)
                        .environmentObject(memberStore)
                case .confirmed:
                    MemberGateScreen(
                        drop: drop,
                        memberName: currentMember?.firstName ?? "Member",
                        plusOne: session.plusOneName,
                        circleGoing: circleGoing
                    )
                    .environmentObject(session)
                case .declined:
                    MemberDeclinedScreen()
                        .environmentObject(session)
                }
            } else {
                MemberQuietScreen()
            }
        }
    }
}

// MARK: Member — Drop (Signal)

struct MemberDropScreen: View {
    let drop       : FPDrop
    let circleGoing: [FPMember]
    @EnvironmentObject var session: MemberSession
    @State private var cardUp = false

    var body: some View {
        ZStack(alignment: .bottom) {
            // Dark atmospheric background
            LinearGradient(
                colors: [Color(h: "#1A1208"), Color(h: "#0D0B09"), Color(h: "#0A0908")],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // FORM PRIVATE wordmark
            VStack {
                HStack {
                    Spacer()
                    VStack(spacing: 2) {
                        Text("FORM")
                            .font(.custom("Georgia", size: 13))
                            .tracking(5)
                            .foregroundColor(.fpHero)
                        Text("PRIVATE")
                            .font(DS.label(8))
                            .tracking(5)
                            .foregroundColor(.fpHero.opacity(0.25))
                    }
                    Spacer()
                }
                .padding(.top, 58)

                Text("DROP")
                    .font(DS.label(9))
                    .tracking(5)
                    .foregroundColor(.fpHero.opacity(0.2))
                    .padding(.top, 8)
                Spacer()
            }

            // Rising card
            VStack(spacing: 0) {
                // Card body
                VStack(spacing: 0) {
                    VStack(spacing: 0) {
                        // Date eyebrow
                        Text(drop.dateLabel.uppercased())
                            .font(DS.label(10.5))
                            .tracking(1.5)
                            .foregroundColor(.fpDim)
                            .padding(.top, 24)
                            .padding(.bottom, 5)

                        // Occasion — italic serif
                        Text(drop.occasion)
                            .font(.custom("Georgia-Italic", size: 13))
                            .foregroundColor(.fpMuted)
                            .multilineTextAlignment(.center)
                            .lineSpacing(3)
                            .padding(.horizontal, 28)
                            .padding(.bottom, 10)

                        Text(drop.timeWindow)
                            .font(DS.body(14.5, weight: .medium))
                            .foregroundColor(.fpInk2)

                        Text(drop.location)
                            .font(DS.body(13))
                            .foregroundColor(.fpDim)
                            .padding(.top, 2)
                            .padding(.bottom, 16)

                        Rectangle().fill(Color.fpLine).frame(height: 1)

                        // Circle orient layer
                        if !circleGoing.isEmpty {
                            VStack(spacing: 8) {
                                HStack(spacing: -8) {
                                    ForEach(circleGoing.prefix(5)) { m in
                                        MemberAvatar(initials: m.initials, size: 30,
                                                     bg: Color(h: "#E8E4DB"),
                                                     fg: Color(h: "#6B6358"),
                                                     border: Color.fpSurface)
                                    }
                                }
                                Text(circleGoing.prefix(3).map { $0.firstName }.joined(separator: ", ")
                                     + (circleGoing.count > 3 ? " + \(circleGoing.count - 3) more" : "")
                                     + " are in")
                                    .font(DS.body(12.5))
                                    .foregroundColor(.fpMuted)
                            }
                            .padding(.vertical, 14)

                            Rectangle().fill(Color.fpLine).frame(height: 1)
                        }

                        Text("Respond below.")
                            .font(.custom("Georgia-Italic", size: 13))
                            .foregroundColor(.fpMuted)
                            .padding(.vertical, 13)
                    }
                    .background(Color.fpSurface)

                    // CTA
                    Button {
                        session.beginRespond()
                    } label: {
                        Text("RESPOND")
                            .font(DS.label(10.5))
                            .tracking(4)
                            .foregroundColor(.fpHero)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(Color.fpDarkMid)
                    }
                    .buttonStyle(.plain)
                }
                .clipShape(
                    UnevenRoundedRectangle(
                        topLeadingRadius: 22,
                        bottomLeadingRadius: 0,
                        bottomTrailingRadius: 0,
                        topTrailingRadius: 22
                    )
                )
                .shadow(color: .black.opacity(0.45), radius: 40, x: 0, y: -8)
            }
            .offset(y: cardUp ? 0 : 140)
            .opacity(cardUp ? 1 : 0)
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.spring(response: 0.55, dampingFraction: 0.82).delay(0.1)) {
                cardUp = true
            }
        }
    }
}

// MARK: Member — Respond (Confirm)

struct MemberRespondScreen: View {
    let drop: FPDrop
    @EnvironmentObject var session    : MemberSession
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore

    @State private var choice    : Bool? = true   // true = in, false = out
    @State private var plusOne   = ""
    @State private var showPlus  = false
    @State private var appeared  = false

    // For pilot: respond as first member
    var currentMemberId: UUID? { memberStore.members.first?.id }

    var canConfirm: Bool {
        guard choice != nil else { return false }
        if showPlus && plusOne.trimmingCharacters(in: .whitespaces).isEmpty { return false }
        return true
    }

    var body: some View {
        ZStack {
            Color.fpBg.ignoresSafeArea()

            VStack(spacing: 0) {
                // Back
                HStack {
                    Button { session.reset() } label: {
                        HStack(spacing: 5) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Back").font(DS.body(13))
                        }
                        .foregroundColor(.fpMuted)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                }
                .padding(.top, 56)
                .padding(.horizontal, 22)
                .padding(.bottom, 14)

                // Title
                VStack(alignment: .leading, spacing: 3) {
                    Text(drop.dateLabel)
                        .font(DS.label(10)).tracking(1.5).foregroundColor(.fpDim)
                    Text("Response")
                        .font(DS.serif(26)).foregroundColor(.fpInk)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 22)
                .padding(.bottom, 16)

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 10) {

                        // Summary card
                        VStack(spacing: 0) {
                            summaryRow("Date",     "\(drop.dateLabel) · \(drop.timeWindow)")
                            FPRule()
                            summaryRow("Location", drop.location)
                            FPRule()
                            summaryRow("Cost",     drop.costLabel,
                                       vc: drop.costType == .free ? .fpGreen : .fpInk2)
                            if let dep = drop.depositAmount {
                                FPRule()
                                summaryRow("Deposit", "$\(Int(dep)) at RSVP", vc: .fpAmber)
                            }
                        }
                        .background(Color.fpWhite)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Color.fpLine, lineWidth: 1))

                        // Choice buttons
                        choiceButton(
                            label: "I'll be there",
                            sub: drop.classType.isA
                                 ? "Deposit required — credited to your total"
                                 : "RSVP is a commitment",
                            selected: choice == true
                        ) { choice = true }

                        choiceButton(
                            label: "Not this time",
                            sub: "No explanation needed",
                            selected: choice == false
                        ) { choice = false }

                        // Guest field
                        if choice == true {
                            VStack(alignment: .leading, spacing: 8) {
                                Button {
                                    withAnimation(.easeInOut(duration: 0.18)) {
                                        showPlus.toggle()
                                        if !showPlus { plusOne = "" }
                                    }
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: showPlus ? "minus.circle" : "plus.circle")
                                            .foregroundColor(.fpDim)
                                        Text(showPlus ? "Remove guest" : "Bring a guest")
                                            .font(DS.body(14)).foregroundColor(.fpMuted)
                                    }
                                }
                                .buttonStyle(.plain)

                                if showPlus {
                                    FPField(label: "Guest name", text: $plusOne,
                                            placeholder: "Full name — required before confirming")
                                        .transition(.opacity.combined(with: .move(edge: .top)))
                                }
                            }
                            .padding(.horizontal, 2)
                        }

                        // Deposit note — Class A only
                        if choice == true && drop.classType.isA {
                            HStack(alignment: .top, spacing: DS.sm) {
                                Image(systemName: "info.circle")
                                    .foregroundColor(.fpAmber).font(.system(size: 14))
                                    .padding(.top, 1)
                                Text("The deposit secures your spot and is credited toward your total. Non-refundable inside 48 hours — rare exceptions at curator discretion.")
                                    .font(DS.body(12)).foregroundColor(.fpAmber.opacity(0.9))
                                    .lineSpacing(3)
                            }
                            .padding(14)
                            .background(Color.fpAmberBg)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(Color.fpAmber.opacity(0.18), lineWidth: 1))
                        }

                        // Confirm
                        Button {
                            if let memberId = currentMemberId {
                                dropStore.respond(
                                    dropId: drop.id,
                                    memberId: memberId,
                                    response: choice == true ? .confirmed : .declined,
                                    plusOne: showPlus ? plusOne : nil
                                )
                            }
                            if choice == true {
                                session.confirm(plusOne: showPlus ? plusOne : "")
                            } else {
                                session.decline()
                            }
                        } label: {
                            Text(choice == true ? "CONFIRM" : "DECLINE")
                                .font(DS.label(10.5)).tracking(3)
                                .foregroundColor(.fpHero)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(canConfirm ? Color.fpInk : Color.fpLine)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .disabled(!canConfirm)
                        .buttonStyle(.plain)

                        Text("RSVP means RSVP. Presence matters more than presentation.")
                            .font(.custom("Georgia-Italic", size: 12))
                            .foregroundColor(.fpDim)
                            .multilineTextAlignment(.center)
                            .padding(.top, 4)

                        Spacer(minLength: DS.sb)
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 4)
                }
            }
        }
        .opacity(appeared ? 1 : 0)
        .onAppear { withAnimation(.easeOut(duration: 0.22)) { appeared = true } }
    }

    private func summaryRow(_ label: String, _ value: String, vc: Color = .fpInk2) -> some View {
        HStack(alignment: .top) {
            Text(label).font(DS.body(11.5)).foregroundColor(.fpDim).frame(width: 72, alignment: .leading)
            Text(value).font(DS.body(13.5, weight: .medium)).foregroundColor(vc)
                .multilineTextAlignment(.trailing).frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.horizontal, 18).padding(.vertical, 10)
    }

    private func choiceButton(label: String, sub: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).font(DS.body(15, weight: .medium))
                        .foregroundColor(selected ? .fpHero : .fpInk)
                    Text(sub).font(DS.body(12))
                        .foregroundColor(selected ? .fpHero.opacity(0.5) : .fpDim)
                }
                Spacer()
                ZStack {
                    Circle().stroke(selected ? Color.fpHero : Color.fpLine, lineWidth: 1.5)
                        .frame(width: 20, height: 20)
                    if selected {
                        Circle().fill(.fpHero).frame(width: 9, height: 9)
                    }
                }
            }
            .padding(.horizontal, 18).padding(.vertical, 15)
            .background(selected ? Color.fpInk : Color.fpWhite)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(selected ? Color.fpInk : Color.fpLine, lineWidth: selected ? 0 : 1.5))
            .animation(.easeInOut(duration: 0.15), value: selected)
        }
        .buttonStyle(.plain)
    }
}

// MARK: Member — Gate (Access)

struct MemberGateScreen: View {
    let drop       : FPDrop
    let memberName : String
    let plusOne    : String
    let circleGoing: [FPMember]
    @EnvironmentObject var session: MemberSession
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color.fpDark.ignoresSafeArea()

            // Green glow
            RadialGradient(
                colors: [Color(h: "#2D6645").opacity(0.08), Color.clear],
                center: .center, startRadius: 0, endRadius: 300
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Wordmark
                VStack(spacing: 3) {
                    Text("FORM").font(.custom("Georgia", size: 12)).tracking(5)
                        .foregroundColor(.fpHero.opacity(0.18))
                    Text("PRIVATE").font(DS.label(7)).tracking(5)
                        .foregroundColor(.fpHero.opacity(0.09))
                }
                .padding(.bottom, 44)

                // Confirmed pill
                HStack(spacing: 6) {
                    Circle().fill(Color.fpGreen).frame(width: 5, height: 5)
                        .shadow(color: Color.fpGreen.opacity(0.6), radius: 3)
                    Text("CONFIRMED").font(DS.label(9)).tracking(2.5)
                        .foregroundColor(Color.fpGreen.opacity(0.7))
                }
                .padding(.horizontal, 16).padding(.vertical, 7)
                .background(Color.fpGreen.opacity(0.07))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.fpGreen.opacity(0.2), lineWidth: 1))
                .padding(.bottom, 18)

                // Event title
                Text(drop.title)
                    .font(.custom("Georgia", size: 32))
                    .foregroundColor(.fpHero)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                VStack(spacing: 4) {
                    Text("\(drop.dateLabel) · \(drop.timeWindow)")
                        .font(DS.body(13)).foregroundColor(.fpHero.opacity(0.4))
                    Text(drop.location)
                        .font(DS.body(12)).foregroundColor(.fpHero.opacity(0.22))
                }
                .padding(.top, 12).padding(.bottom, 36)

                // Entry token — name as access signal
                VStack(spacing: 8) {
                    Text("YOUR ENTRY")
                        .font(DS.label(9)).tracking(2.5).foregroundColor(.fpHero.opacity(0.22))
                    Text(memberName.uppercased())
                        .font(.custom("Georgia", size: 28)).tracking(6)
                        .foregroundColor(.fpHero)
                    if !plusOne.isEmpty {
                        Text("+ \(plusOne)")
                            .font(DS.body(13)).foregroundColor(.fpHero.opacity(0.4))
                    }
                    Text("Show this at the door")
                        .font(DS.body(11)).foregroundColor(.fpHero.opacity(0.2))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 28)
                .background(.fpHero.opacity(0.04))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(.fpHero.opacity(0.06), lineWidth: 1))
                .padding(.horizontal, 28)

                Spacer()

                // Who's also going
                if !circleGoing.isEmpty {
                    VStack(spacing: 10) {
                        Text("Also going")
                            .font(DS.label(10)).tracking(2).foregroundColor(.fpHero.opacity(0.22))
                        HStack(spacing: -6) {
                            ForEach(circleGoing.prefix(6)) { m in
                                MemberAvatar(
                                    initials: m.initials, size: 32,
                                    bg: .fpHero.opacity(0.08),
                                    fg: .fpHero.opacity(0.5),
                                    border: Color.fpDark
                                )
                            }
                        }
                        Text(circleGoing.prefix(3).map { $0.firstName }.joined(separator: " · "))
                            .font(DS.body(12)).foregroundColor(.fpHero.opacity(0.2))
                    }
                    .padding(.bottom, 28)
                }

                Text("The village is where you're going.")
                    .font(.custom("Georgia-Italic", size: 13))
                    .foregroundColor(.fpHero.opacity(0.18))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 48)
                    .padding(.bottom, DS.sb)
            }
        }
        .opacity(appeared ? 1 : 0)
        .scaleEffect(appeared ? 1 : 0.97)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.85).delay(0.05)) {
                appeared = true
            }
        }
    }
}

// MARK: Member — Declined

struct MemberDeclinedScreen: View {
    @EnvironmentObject var session: MemberSession
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color.fpBg.ignoresSafeArea()
            VStack(spacing: DS.md) {
                Spacer()
                Text("Not this time.")
                    .font(DS.serif(26)).foregroundColor(.fpInk)
                Text("The village will be there.\nYou'll be at the next one.")
                    .font(DS.body(15)).foregroundColor(.fpMuted)
                    .multilineTextAlignment(.center).lineSpacing(4)
                Spacer()
                Button { session.reset() } label: {
                    Text("View drop again")
                        .font(DS.body(14)).foregroundColor(.fpDim)
                }
                .buttonStyle(.plain)
                .padding(.bottom, DS.sb)
            }
            .padding(.horizontal, DS.sh)
        }
        .opacity(appeared ? 1 : 0)
        .onAppear { withAnimation(.easeOut(duration: 0.3)) { appeared = true } }
    }
}

// MARK: Member — Quiet (no active drop)

struct MemberQuietScreen: View {
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color.fpDark.ignoresSafeArea()
            VStack(spacing: DS.md) {
                Spacer()
                VStack(spacing: 3) {
                    Text("FORM").font(.custom("Georgia", size: 14)).tracking(5)
                        .foregroundColor(.fpHero.opacity(0.2))
                    Text("PRIVATE").font(DS.label(8)).tracking(5)
                        .foregroundColor(.fpHero.opacity(0.1))
                }
                Text("The village is quiet.")
                    .font(.custom("Georgia", size: 22))
                    .foregroundColor(.fpHero.opacity(0.32))
                Text("You'll be notified when the\nnext gathering is called.")
                    .font(DS.body(14)).foregroundColor(.fpHero.opacity(0.15))
                    .multilineTextAlignment(.center).lineSpacing(4)
                Spacer()
            }
        }
        .opacity(appeared ? 1 : 0)
        .onAppear { withAnimation(.easeOut(duration: 0.5)) { appeared = true } }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Color extension (fpAccent for UI feedback)
// ─────────────────────────────────────────────────────────────────────────────

extension Color {
    static let fpAccent = Color(h: "#3A5A78")
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Previews
// ─────────────────────────────────────────────────────────────────────────────

#Preview("Member — Drop") {
    let ds = DropStore()
    let ms = MemberStore()
    ds.drops = [FPDrop(
        title: "Sunday at the River",
        occasion: "Afternoon into evening. Music. Good company.",
        date: Calendar.current.date(byAdding: .day, value: 6, to: Date())!,
        timeWindow: "5 – 9 pm",
        location: "Casa Neos Beach House · Miami River",
        classType: .a, costType: .fixed, costAmount: 55,
        depositAmount: 20, capacity: 24,
        rsvpDeadline: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
        status: .live, venueConfirmed: true
    )]
    return MemberRootView()
        .environmentObject(ds)
        .environmentObject(ms)
}

#Preview("Curator — Drops") {
    let ds = DropStore()
    let ms = MemberStore()
    return CuratorRootView()
        .environmentObject(ds)
        .environmentObject(ms)
}

#Preview("Quiet") {
    MemberQuietScreen()
}
