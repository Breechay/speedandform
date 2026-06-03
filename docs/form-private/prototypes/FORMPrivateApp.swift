// ─────────────────────────────────────────────────────────────────────────────
// FORMPrivateApp.swift
// FORM Private — Single file. Cursor will split later.
//
// Doctrine: Clean coordination. Save the excitement for the room.
// The app does four things: Signal → Confirm → Orient → Disappear.
//
// Architecture:
//   Models        — FPDrop, FPMember, FPRsvp, FPStewardshipNote
//   Stores        — DropStore, MemberStore, StewardshipStore
//   Design System — Colors, Typography, Spacing, Components
//   Views         — RootView, DropsView, DropDetailView, MemberRosterView,
//                   MemberDetailView, CreateDropView, PostEventView,
//                   StewardshipView, SettingsView
//
// ─────────────────────────────────────────────────────────────────────────────

import SwiftUI

// MARK: - App Entry

@main
struct FORMPrivateApp: App {
    @StateObject private var dropStore     = DropStore()
    @StateObject private var memberStore   = MemberStore()
    @StateObject private var stewStore     = StewardshipStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(dropStore)
                .environmentObject(memberStore)
                .environmentObject(stewStore)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Design System
// ─────────────────────────────────────────────────────────────────────────────

// MARK: Colors
extension Color {
    // Background
    static let fpBg      = Color(hex: "#F0EDE6")   // warm parchment
    static let fpBg2     = Color(hex: "#E8E4DB")
    static let fpSurface = Color(hex: "#FAFAF7")   // card surface
    static let fpSurface2 = Color(hex: "#F5F2EC")

    // Ink
    static let fpInk     = Color(hex: "#1A1710")   // near-black warm
    static let fpInk2    = Color(hex: "#2E2A22")
    static let fpMuted   = Color(hex: "#6B6358")
    static let fpDim     = Color(hex: "#9E978C")
    static let fpXdim    = Color(hex: "#C8C2B8")

    // Lines
    static let fpLine    = Color(hex: "#DDD9D0")
    static let fpLine2   = Color(hex: "#E8E4DB")

    // Status
    static let fpGreen   = Color(hex: "#2D6645")
    static let fpGreenBg = Color(hex: "#EBF4EE")
    static let fpAmber   = Color(hex: "#7A5E28")
    static let fpAmberBg = Color(hex: "#F5EFDF")
    static let fpRed     = Color(hex: "#8A3C2E")
    static let fpRedBg   = Color(hex: "#F5ECEA")
    static let fpAccent  = Color(hex: "#3A5A78")
    static let fpAccentBg = Color(hex: "#EBF0F5")

    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        self.init(
            red:   Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >>  8) & 0xFF) / 255,
            blue:  Double( rgb        & 0xFF) / 255
        )
    }
}

// MARK: Typography
struct FPFont {
    static func serif(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Georgia", size: size).weight(weight)
    }
    static func body(_ size: CGFloat = 15, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }
    static func caption(_ size: CGFloat = 11) -> Font {
        .system(size: size, weight: .semibold, design: .default)
    }
    static func mono(_ size: CGFloat = 12) -> Font {
        .system(size: size, weight: .regular, design: .monospaced)
    }
}

// MARK: Spacing
enum FPS {
    static let xs: CGFloat  =  4
    static let sm: CGFloat  =  8
    static let md: CGFloat  = 16
    static let lg: CGFloat  = 24
    static let xl: CGFloat  = 32
    static let xxl: CGFloat = 48
    static let screenH: CGFloat = 20   // horizontal screen padding
    static let screenB: CGFloat = 40   // bottom padding
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Models
// ─────────────────────────────────────────────────────────────────────────────

// MARK: FPDrop
struct FPDrop: Identifiable, Codable {
    var id       = UUID()
    var title    : String
    var occasion : String         // vibe / reason to show up
    var date     : Date
    var timeWindow: String        // e.g. "5 – 9 pm"
    var location : String
    var costType : CostType
    var costAmount: Double?
    var capacity : Int?
    var rsvpDeadline: Date
    var status   : DropStatus
    var classType: DropClass
    var depositAmount: Double?
    var venueTermsConfirmed: Bool = false

    enum CostType: String, Codable, CaseIterable {
        case zero    = "No cost"
        case estimate = "Estimate"
        case fixed   = "Fixed"
    }
    enum DropStatus: String, Codable {
        case draft, live, closed, completed, cancelled
    }
    enum DropClass: String, Codable, CaseIterable {
        case a = "A"   // high-commitment
        case b = "B"   // low-friction
    }
}

// MARK: FPRsvp
struct FPRsvp: Identifiable, Codable {
    var id          = UUID()
    var dropId      : UUID
    var memberId    : UUID
    var response    : Response
    var plusOneName : String?
    var depositVerified: Bool = false
    var attended    : Bool?   = nil
    var timestamp   = Date()

    enum Response: String, Codable {
        case inConfirmed = "in"
        case out         = "out"
        case waitlisted
    }
}

// MARK: FPMember
struct FPMember: Identifiable, Codable {
    var id          = UUID()
    var firstName   : String
    var lastName    : String
    var avatar      : String?    // URL or SF symbol name
    var status      : MemberStatus
    var vouchTier   : VouchTier
    var vouchedById : UUID?
    var lastAttended: Date?
    var joinedAt    = Date()
    var phone       : String?
    var notes       : String?    // curator private notes

    var displayName: String { "\(firstName) \(lastName)" }
    var initials: String {
        let f = firstName.first.map(String.init) ?? ""
        let l = lastName.first.map(String.init) ?? ""
        return "\(f)\(l)".uppercased()
    }

    enum MemberStatus: String, Codable, CaseIterable {
        case active, fading, paused, exited
        var label: String { rawValue.capitalized }
        var color: Color {
            switch self {
            case .active:  return .fpGreen
            case .fading:  return .fpAmber
            case .paused:  return .fpDim
            case .exited:  return .fpRed
            }
        }
        var bgColor: Color {
            switch self {
            case .active:  return .fpGreenBg
            case .fading:  return .fpAmberBg
            case .paused:  return Color.fpSurface2
            case .exited:  return .fpRedBg
            }
        }
    }
    enum VouchTier: Int, Codable {
        case full = 1       // auto-trust
        case developing = 2 // curator review
    }
}

// MARK: FPStewardshipNote
struct FPStewardshipNote: Identifiable, Codable {
    var id       = UUID()
    var memberId : UUID
    var dropId   : UUID?
    var signal   : Signal
    var text     : String
    var createdAt = Date()

    enum Signal: String, Codable {
        case positive, concern
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Stores
// ─────────────────────────────────────────────────────────────────────────────

final class DropStore: ObservableObject {
    @Published var drops: [FPDrop] = FPDrop.sampleData
    @Published var rsvps: [FPRsvp] = []

    func rsvps(for drop: FPDrop) -> [FPRsvp] {
        rsvps.filter { $0.dropId == drop.id }
    }
    func confirmedCount(for drop: FPDrop) -> Int {
        rsvps(for: drop).filter { $0.response == .inConfirmed }.count
    }
    func respond(dropId: UUID, memberId: UUID, response: FPRsvp.Response, plusOne: String? = nil) {
        if let idx = rsvps.firstIndex(where: { $0.dropId == dropId && $0.memberId == memberId }) {
            rsvps[idx].response = response
        } else {
            rsvps.append(FPRsvp(dropId: dropId, memberId: memberId, response: response, plusOneName: plusOne))
        }
    }
    func liveDrops() -> [FPDrop] {
        drops.filter { $0.status == .live }.sorted { $0.date < $1.date }
    }
    func upcomingDrops() -> [FPDrop] {
        drops.filter { $0.date > Date() && $0.status != .cancelled }.sorted { $0.date < $1.date }
    }
}

final class MemberStore: ObservableObject {
    @Published var members: [FPMember] = FPMember.sampleData

    var active: [FPMember]  { members.filter { $0.status == .active } }
    var fading: [FPMember]  { members.filter { $0.status == .fading } }
    func member(id: UUID) -> FPMember? { members.first { $0.id == id } }
}

final class StewardshipStore: ObservableObject {
    @Published var notes: [FPStewardshipNote] = []

    func notes(for memberId: UUID) -> [FPStewardshipNote] {
        notes.filter { $0.memberId == memberId }.sorted { $0.createdAt > $1.createdAt }
    }
    func add(_ note: FPStewardshipNote) { notes.insert(note, at: 0) }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Sample Data
// ─────────────────────────────────────────────────────────────────────────────

extension FPDrop {
    static let sampleData: [FPDrop] = [
        FPDrop(
            title: "Sunday at the River",
            occasion: "Afternoon into evening. Music. Good company.",
            date: Calendar.current.date(byAdding: .day, value: 6, to: Date())!,
            timeWindow: "5 – 9 pm",
            location: "Casa Neos Beach House · Miami River",
            costType: .fixed,
            costAmount: 55,
            capacity: 24,
            rsvpDeadline: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
            status: .live,
            classType: .a,
            depositAmount: 20,
            venueTermsConfirmed: true
        ),
        FPDrop(
            title: "Bayfront Movement Morning",
            occasion: "Walk the waterfront. Coffee after.",
            date: Calendar.current.date(byAdding: .day, value: 14, to: Date())!,
            timeWindow: "8 – 10 am",
            location: "Bayfront Park · Downtown Miami",
            costType: .zero,
            costAmount: nil,
            capacity: 20,
            rsvpDeadline: Calendar.current.date(byAdding: .day, value: 11, to: Date())!,
            status: .live,
            classType: .b,
            depositAmount: nil,
            venueTermsConfirmed: true
        )
    ]
}

extension FPMember {
    static let sampleData: [FPMember] = [
        FPMember(firstName: "Marcus",   lastName: "B.",   status: .active, vouchTier: .full),
        FPMember(firstName: "Lara",     lastName: "F.",   status: .active, vouchTier: .full),
        FPMember(firstName: "Chloe",    lastName: "B.",   status: .active, vouchTier: .full),
        FPMember(firstName: "Tinius",   lastName: "S.",   status: .active, vouchTier: .developing),
        FPMember(firstName: "Emily",    lastName: "K.",   status: .active, vouchTier: .full),
        FPMember(firstName: "Hayden",   lastName: "P.",   status: .fading, vouchTier: .developing),
        FPMember(firstName: "Andrea",   lastName: "A.",   status: .active, vouchTier: .full),
        FPMember(firstName: "Milos",    lastName: "V.",   status: .active, vouchTier: .developing),
        FPMember(firstName: "Paola",    lastName: "D.",   status: .active, vouchTier: .full),
        FPMember(firstName: "Sam",      lastName: "P.",   status: .active, vouchTier: .developing),
    ]
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Shared UI Components
// ─────────────────────────────────────────────────────────────────────────────

struct FPDivider: View {
    var body: some View {
        Rectangle().fill(Color.fpLine).frame(height: 1)
    }
}

struct FPEyebrow: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(FPFont.caption(10.5))
            .tracking(2.0)
            .foregroundColor(.fpDim)
    }
}

struct FPStatusPill: View {
    let text: String
    let fg: Color
    let bg: Color
    var border: Color? = nil

    var body: some View {
        Text(text)
            .font(FPFont.caption(11))
            .tracking(0.4)
            .foregroundColor(fg)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(bg)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(border ?? fg.opacity(0.2), lineWidth: 1))
    }
}

struct FPCard<Content: View>: View {
    let content: () -> Content
    var active: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content()
        }
        .background(active ? Color.white : Color.fpSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.fpLine, lineWidth: 1)
        )
    }
}

struct MemberAvatar: View {
    let member: FPMember
    var size: CGFloat = 36

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.fpBg2)
            Text(member.initials)
                .font(FPFont.body(size * 0.33, weight: .semibold))
                .foregroundColor(.fpMuted)
        }
        .frame(width: size, height: size)
        .overlay(Circle().stroke(Color.fpLine, lineWidth: 1))
    }
}

struct DoctrineBlock: View {
    let text: String
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Rectangle()
                .fill(Color.fpInk.opacity(0.18))
                .frame(width: 2)
            Text(text)
                .font(FPFont.body(14).italic())
                .foregroundColor(.fpInk2)
                .lineSpacing(4)
        }
        .padding(.vertical, 14)
        .padding(.trailing, 14)
        .background(Color.fpInk.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Root Navigation
// ─────────────────────────────────────────────────────────────────────────────

struct RootView: View {
    @State private var tab: AppTab = .drops

    enum AppTab { case drops, roster, stewardship }

    var body: some View {
        TabView(selection: $tab) {
            DropsView()
                .tabItem {
                    Label("Drops", systemImage: "circle.dotted")
                }
                .tag(AppTab.drops)

            MemberRosterView()
                .tabItem {
                    Label("Roster", systemImage: "person.2")
                }
                .tag(AppTab.roster)

            StewardshipView()
                .tabItem {
                    Label("Field", systemImage: "eye")
                }
                .tag(AppTab.stewardship)
        }
        .tint(Color.fpInk)
        .background(Color.fpBg)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Drops View
// ─────────────────────────────────────────────────────────────────────────────

struct DropsView: View {
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore
    @State private var showCreate = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    // Page header
                    VStack(alignment: .leading, spacing: 6) {
                        FPEyebrow(text: "FORM Private")
                        Text("Drops")
                            .font(FPFont.serif(34))
                            .foregroundColor(.fpInk)
                        Text("Signal → Confirm → Disappear.")
                            .font(FPFont.body(15))
                            .foregroundColor(.fpMuted)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.top, FPS.lg)
                    .padding(.bottom, FPS.lg)

                    FPDivider()

                    // Upcoming drops
                    let upcoming = dropStore.upcomingDrops()
                    if upcoming.isEmpty {
                        VStack(spacing: FPS.md) {
                            Text("The village is quiet.")
                                .font(FPFont.serif(20))
                                .foregroundColor(.fpDim)
                            Text("Create a Drop when the venue is confirmed.")
                                .font(FPFont.body(14))
                                .foregroundColor(.fpXdim)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, FPS.xxl)
                    } else {
                        VStack(spacing: FPS.sm) {
                            ForEach(upcoming) { drop in
                                NavigationLink {
                                    DropDetailView(drop: drop)
                                } label: {
                                    DropRowView(drop: drop)
                                }
                                .buttonStyle(.plain)
                                .padding(.horizontal, FPS.screenH)
                            }
                        }
                        .padding(.vertical, FPS.md)
                    }

                    // Past drops section
                    let past = dropStore.drops.filter { $0.status == .completed }
                    if !past.isEmpty {
                        VStack(alignment: .leading, spacing: 0) {
                            HStack {
                                FPEyebrow(text: "Past")
                                Spacer()
                            }
                            .padding(.horizontal, FPS.screenH)
                            .padding(.vertical, FPS.sm)
                            FPDivider()
                            ForEach(past) { drop in
                                NavigationLink {
                                    DropDetailView(drop: drop)
                                } label: {
                                    DropRowView(drop: drop, muted: true)
                                }
                                .buttonStyle(.plain)
                                .padding(.horizontal, FPS.screenH)
                            }
                        }
                    }

                    Spacer(minLength: FPS.screenB)
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
                CreateDropView()
                    .environmentObject(dropStore)
            }
        }
    }
}

// MARK: Drop Row
struct DropRowView: View {
    let drop: FPDrop
    var muted: Bool = false

    @EnvironmentObject var dropStore: DropStore

    var body: some View {
        FPCard(active: !muted) {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 3) {
                        FPEyebrow(text: dateLabel)
                        Text(drop.title)
                            .font(FPFont.serif(19))
                            .foregroundColor(muted ? .fpMuted : .fpInk)
                            .lineLimit(2)
                    }
                    Spacer()
                    classBadge
                }
                .padding(.horizontal, FPS.md)
                .padding(.top, FPS.md)
                .padding(.bottom, FPS.sm)

                FPDivider()

                // Details row
                HStack(spacing: FPS.md) {
                    Label(drop.location, systemImage: "mappin")
                        .font(FPFont.body(13))
                        .foregroundColor(.fpMuted)
                        .lineLimit(1)
                    Spacer()
                    costLabel
                }
                .padding(.horizontal, FPS.md)
                .padding(.vertical, FPS.sm)

                FPDivider()

                // RSVP count
                HStack {
                    let confirmed = dropStore.confirmedCount(for: drop)
                    let cap = drop.capacity ?? 0
                    Text("\(confirmed)\(cap > 0 ? " / \(cap)" : "") confirmed")
                        .font(FPFont.body(12))
                        .foregroundColor(.fpDim)
                    Spacer()
                    rsvpDeadlineLabel
                }
                .padding(.horizontal, FPS.md)
                .padding(.vertical, FPS.sm)
            }
        }
        .opacity(muted ? 0.6 : 1)
        .padding(.bottom, 2)
    }

    private var dateLabel: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return "\(f.string(from: drop.date)) · \(drop.timeWindow)"
    }

    private var classBadge: some View {
        Text("Class \(drop.classType.rawValue)")
            .font(FPFont.caption(10))
            .tracking(1)
            .foregroundColor(drop.classType == .a ? .fpAccent : .fpDim)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(drop.classType == .a ? Color.fpAccentBg : Color.fpSurface2)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(drop.classType == .a ? Color.fpAccent.opacity(0.2) : Color.fpLine, lineWidth: 1))
    }

    private var costLabel: some View {
        Group {
            switch drop.costType {
            case .zero:
                Text("No cost")
                    .foregroundColor(.fpGreen)
            case .estimate:
                Text("~$\(Int(drop.costAmount ?? 0)) est.")
                    .foregroundColor(.fpMuted)
            case .fixed:
                Text("$\(Int(drop.costAmount ?? 0)) fixed")
                    .foregroundColor(.fpInk2)
            }
        }
        .font(FPFont.body(13, weight: .medium))
    }

    private var rsvpDeadlineLabel: some View {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        let isPast = drop.rsvpDeadline < Date()
        return Text("RSVP by \(f.string(from: drop.rsvpDeadline))")
            .font(FPFont.body(12))
            .foregroundColor(isPast ? .fpRed : .fpDim)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Drop Detail View
// ─────────────────────────────────────────────────────────────────────────────

struct DropDetailView: View {
    let drop: FPDrop
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore
    @State private var showPostEvent = false

    var confirmed: [FPRsvp] { dropStore.rsvps(for: drop).filter { $0.response == .inConfirmed } }
    var out: [FPRsvp]       { dropStore.rsvps(for: drop).filter { $0.response == .out } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                // Hero block
                VStack(alignment: .leading, spacing: FPS.xs) {
                    FPEyebrow(text: dateLabel)
                        .padding(.bottom, 2)
                    Text(drop.title)
                        .font(FPFont.serif(30))
                        .foregroundColor(.fpInk)
                    Text(drop.occasion)
                        .font(FPFont.body(15).italic())
                        .foregroundColor(.fpMuted)
                        .padding(.top, 2)
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.top, FPS.lg)
                .padding(.bottom, FPS.lg)

                FPDivider()

                // Info grid
                VStack(spacing: 0) {
                    infoRow(icon: "mappin.circle", label: "Location", value: drop.location)
                    FPDivider()
                    infoRow(icon: "clock", label: "Time", value: drop.timeWindow)
                    FPDivider()
                    infoRow(icon: "person.2", label: "Capacity", value: drop.capacity.map { "\($0) spots" } ?? "Open")
                    FPDivider()
                    infoRow(icon: "creditcard", label: "Cost",
                            value: costString,
                            valueColor: costColor)
                    if drop.depositAmount != nil {
                        FPDivider()
                        infoRow(icon: "arrow.down.circle", label: "Deposit",
                                value: "$\(Int(drop.depositAmount!)) at RSVP",
                                valueColor: .fpAmber)
                    }
                    FPDivider()
                    infoRow(icon: "checkmark.seal",
                            label: "Venue confirmed",
                            value: drop.venueTermsConfirmed ? "Yes" : "Not yet",
                            valueColor: drop.venueTermsConfirmed ? .fpGreen : .fpRed)
                }
                .padding(.vertical, FPS.xs)

                FPDivider()

                // Headcount
                VStack(alignment: .leading, spacing: FPS.md) {
                    HStack {
                        FPEyebrow(text: "Headcount")
                        Spacer()
                        Text("\(confirmed.count) confirmed")
                            .font(FPFont.body(13, weight: .semibold))
                            .foregroundColor(.fpGreen)
                    }

                    // Avatar row of confirmed
                    if !confirmed.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: -8) {
                                ForEach(confirmed.prefix(12)) { rsvp in
                                    if let member = memberStore.member(id: rsvp.memberId) {
                                        MemberAvatar(member: member, size: 40)
                                            .overlay(Circle().stroke(Color.fpBg, lineWidth: 2))
                                    }
                                }
                                if confirmed.count > 12 {
                                    ZStack {
                                        Circle().fill(Color.fpSurface2).frame(width: 40, height: 40)
                                        Text("+\(confirmed.count - 12)")
                                            .font(FPFont.body(11, weight: .semibold))
                                            .foregroundColor(.fpMuted)
                                    }
                                    .overlay(Circle().stroke(Color.fpBg, lineWidth: 2))
                                }
                            }
                        }
                    }

                    // Full RSVP list
                    ForEach(confirmed) { rsvp in
                        if let member = memberStore.member(id: rsvp.memberId) {
                            HStack(spacing: FPS.md) {
                                MemberAvatar(member: member, size: 32)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(member.displayName)
                                        .font(FPFont.body(14, weight: .medium))
                                        .foregroundColor(.fpInk)
                                    if let plusOne = rsvp.plusOneName {
                                        Text("+ \(plusOne)")
                                            .font(FPFont.body(12))
                                            .foregroundColor(.fpMuted)
                                    }
                                }
                                Spacer()
                                if rsvp.depositVerified {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.fpGreen)
                                        .font(.system(size: 14))
                                } else if drop.classType == .a {
                                    Text("Deposit pending")
                                        .font(FPFont.caption(10))
                                        .foregroundColor(.fpAmber)
                                }
                            }
                        }
                    }

                    if out.count > 0 {
                        Text("\(out.count) declined")
                            .font(FPFont.body(13))
                            .foregroundColor(.fpDim)
                    }
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.vertical, FPS.md)

                FPDivider()

                // Doctrine reminder
                DoctrineBlock(text: "Venue confirmed before Drop. RSVP means RSVP. Maybe is not a headcount.")
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                FPDivider()

                // Actions
                if drop.status == .live {
                    VStack(spacing: FPS.sm) {
                        Button {
                            showPostEvent = true
                        } label: {
                            HStack {
                                Image(systemName: "square.and.pencil")
                                Text("Post-event evaluation")
                            }
                            .font(FPFont.body(15, weight: .medium))
                            .foregroundColor(.fpInk)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.fpSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color.fpLine, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)
                }

                Spacer(minLength: FPS.screenB)
            }
        }
        .background(Color.fpBg.ignoresSafeArea())
        .navigationTitle(drop.title)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPostEvent) {
            PostEventView(drop: drop)
                .environmentObject(dropStore)
                .environmentObject(memberStore)
        }
    }

    private var dateLabel: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMMM d"
        return f.string(from: drop.date)
    }

    private var costString: String {
        switch drop.costType {
        case .zero:     return "No cost"
        case .estimate: return "~$\(Int(drop.costAmount ?? 0)) est."
        case .fixed:    return "$\(Int(drop.costAmount ?? 0)) fixed"
        }
    }
    private var costColor: Color {
        switch drop.costType {
        case .zero:     return .fpGreen
        case .estimate: return .fpMuted
        case .fixed:    return .fpInk2
        }
    }

    private func infoRow(icon: String, label: String, value: String, valueColor: Color = .fpInk2) -> some View {
        HStack(spacing: FPS.md) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.fpDim)
                .frame(width: 20)
            Text(label)
                .font(FPFont.body(14))
                .foregroundColor(.fpMuted)
            Spacer()
            Text(value)
                .font(FPFont.body(14, weight: .medium))
                .foregroundColor(valueColor)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, FPS.screenH)
        .padding(.vertical, 13)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Create Drop View
// ─────────────────────────────────────────────────────────────────────────────

struct CreateDropView: View {
    @EnvironmentObject var dropStore: DropStore
    @Environment(\.dismiss) private var dismiss

    @State private var title         = ""
    @State private var occasion      = ""
    @State private var date          = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
    @State private var timeWindow    = "6 – 10 pm"
    @State private var location      = ""
    @State private var costType      = FPDrop.CostType.zero
    @State private var costAmount    = ""
    @State private var capacity      = ""
    @State private var depositAmount = ""
    @State private var classType     = FPDrop.DropClass.b
    @State private var venueConfirmed = false
    @State private var rsvpDeadline  = Calendar.current.date(byAdding: .day, value: 4, to: Date())!
    @State private var showWarning   = false

    private var canPublish: Bool {
        !title.isEmpty && !location.isEmpty && venueConfirmed
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    // Warning if venue not confirmed
                    if !venueConfirmed {
                        HStack(spacing: FPS.sm) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.fpAmber)
                            Text("Confirm venue terms before publishing. The drop cannot go out until this is checked.")
                                .font(FPFont.body(13))
                                .foregroundColor(.fpAmber)
                        }
                        .padding(FPS.md)
                        .background(Color.fpAmberBg)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .padding(.horizontal, FPS.screenH)
                        .padding(.top, FPS.md)
                    }

                    formSection("The occasion") {
                        FPTextField(label: "Title", text: $title, placeholder: "Sunday at the River")
                        FPTextField(label: "Vibe / occasion", text: $occasion, placeholder: "Afternoon into evening. Music.")
                        FPTextField(label: "Location", text: $location, placeholder: "Casa Neos · Miami River")
                        FPTextField(label: "Time window", text: $timeWindow, placeholder: "5 – 9 pm")
                    }

                    FPDivider()

                    formSection("When") {
                        DatePicker("Date", selection: $date, displayedComponents: .date)
                            .font(FPFont.body(15))
                            .foregroundColor(.fpInk)
                        DatePicker("RSVP deadline", selection: $rsvpDeadline, displayedComponents: .date)
                            .font(FPFont.body(15))
                            .foregroundColor(.fpInk)
                    }

                    FPDivider()

                    formSection("Logistics") {
                        // Class picker
                        Picker("Class", selection: $classType) {
                            Text("Class A — High commitment").tag(FPDrop.DropClass.a)
                            Text("Class B — Low friction").tag(FPDrop.DropClass.b)
                        }
                        .pickerStyle(.segmented)

                        Picker("Cost", selection: $costType) {
                            ForEach(FPDrop.CostType.allCases, id: \.self) { t in
                                Text(t.rawValue).tag(t)
                            }
                        }
                        .pickerStyle(.segmented)

                        if costType != .zero {
                            FPTextField(label: "Amount ($)", text: $costAmount, placeholder: "55", keyboardType: .decimalPad)
                        }
                        if classType == .a {
                            FPTextField(label: "Deposit ($)", text: $depositAmount, placeholder: "20", keyboardType: .decimalPad)
                        }
                        FPTextField(label: "Capacity", text: $capacity, placeholder: "24", keyboardType: .numberPad)
                    }

                    FPDivider()

                    formSection("Venue confirmation") {
                        VStack(alignment: .leading, spacing: FPS.sm) {
                            Text("Cardinal rule: venue terms must be confirmed in writing before this drop can be published.")
                                .font(FPFont.body(13))
                                .foregroundColor(.fpMuted)
                                .lineSpacing(3)

                            Toggle(isOn: $venueConfirmed) {
                                Text("Venue terms confirmed")
                                    .font(FPFont.body(15, weight: .medium))
                                    .foregroundColor(.fpInk)
                            }
                            .tint(Color.fpGreen)
                        }
                    }

                    FPDivider()

                    // Publish / Save
                    VStack(spacing: FPS.sm) {
                        Button {
                            publishDrop(status: .live)
                        } label: {
                            Text("Publish Drop")
                                .font(FPFont.body(15, weight: .semibold))
                                .foregroundColor(canPublish ? Color.fpBg : Color.fpXdim)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 17)
                                .background(canPublish ? Color.fpInk : Color.fpLine)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .disabled(!canPublish)
                        .buttonStyle(.plain)

                        Button {
                            publishDrop(status: .draft)
                        } label: {
                            Text("Save as draft")
                                .font(FPFont.body(15))
                                .foregroundColor(.fpMuted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    Spacer(minLength: FPS.screenB)
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("New Drop")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .font(FPFont.body(15))
                        .foregroundColor(.fpMuted)
                }
            }
        }
    }

    private func formSection<Content: View>(_ heading: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: FPS.md) {
            FPEyebrow(text: heading)
            content()
        }
        .padding(.horizontal, FPS.screenH)
        .padding(.vertical, FPS.md)
    }

    private func publishDrop(status: FPDrop.DropStatus) {
        let drop = FPDrop(
            title: title.isEmpty ? "Untitled" : title,
            occasion: occasion,
            date: date,
            timeWindow: timeWindow,
            location: location,
            costType: costType,
            costAmount: Double(costAmount),
            capacity: Int(capacity),
            rsvpDeadline: rsvpDeadline,
            status: status,
            classType: classType,
            depositAmount: Double(depositAmount),
            venueTermsConfirmed: venueConfirmed
        )
        dropStore.drops.insert(drop, at: 0)
        dismiss()
    }
}

struct FPTextField: View {
    let label       : String
    @Binding var text: String
    let placeholder  : String
    var keyboardType : UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(FPFont.caption(11))
                .foregroundColor(.fpDim)
            TextField(placeholder, text: $text)
                .font(FPFont.body(15))
                .foregroundColor(.fpInk)
                .keyboardType(keyboardType)
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .background(Color.fpSurface)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(Color.fpLine, lineWidth: 1)
                )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Post Event View
// ─────────────────────────────────────────────────────────────────────────────

struct PostEventView: View {
    let drop: FPDrop
    @EnvironmentObject var dropStore  : DropStore
    @EnvironmentObject var memberStore: MemberStore
    @Environment(\.dismiss) private var dismiss

    @State private var energyRating: Int   = -1   // 0 weak 1 held 2 clean
    @State private var attendanceNotes = ""
    @State private var curatorNote     = ""
    @State private var venueRating: Int    = -1

    var confirmed: [FPRsvp] { dropStore.rsvps(for: drop).filter { $0.response == .inConfirmed } }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    VStack(alignment: .leading, spacing: 4) {
                        FPEyebrow(text: "Post-event")
                        Text("Write it while it's fresh.")
                            .font(FPFont.serif(26))
                            .foregroundColor(.fpInk)
                        Text(drop.title)
                            .font(FPFont.body(14))
                            .foregroundColor(.fpMuted)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.top, FPS.lg)
                    .padding(.bottom, FPS.md)

                    FPDivider()

                    // Attendance
                    VStack(alignment: .leading, spacing: FPS.md) {
                        FPEyebrow(text: "Who showed")
                        Text("Mark attendance for the system's memory.")
                            .font(FPFont.body(13))
                            .foregroundColor(.fpMuted)

                        ForEach(confirmed) { rsvp in
                            if let member = memberStore.member(id: rsvp.memberId) {
                                HStack(spacing: FPS.md) {
                                    MemberAvatar(member: member, size: 34)
                                    Text(member.displayName)
                                        .font(FPFont.body(14))
                                        .foregroundColor(.fpInk)
                                    Spacer()
                                    // Simplified showed toggle
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 20))
                                        .foregroundColor(.fpGreen)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    // Energy rating
                    VStack(alignment: .leading, spacing: FPS.md) {
                        FPEyebrow(text: "Room energy")
                        HStack(spacing: FPS.sm) {
                            ForEach([("Weak", 0), ("Held", 1), ("Clean", 2)], id: \.1) { label, val in
                                Button {
                                    energyRating = val
                                } label: {
                                    Text(label)
                                        .font(FPFont.body(14, weight: energyRating == val ? .semibold : .regular))
                                        .foregroundColor(energyRating == val ? Color.fpBg : Color.fpMuted)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(energyRating == val ? Color.fpInk : Color.fpSurface)
                                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                                .stroke(Color.fpLine, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    // Venue rating
                    VStack(alignment: .leading, spacing: FPS.md) {
                        FPEyebrow(text: "Venue — return?")
                        HStack(spacing: FPS.sm) {
                            ForEach([("No", 0), ("Maybe", 1), ("Yes", 2)], id: \.1) { label, val in
                                Button {
                                    venueRating = val
                                } label: {
                                    Text(label)
                                        .font(FPFont.body(14, weight: venueRating == val ? .semibold : .regular))
                                        .foregroundColor(venueRating == val ? Color.fpBg : Color.fpMuted)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(venueRating == val ? Color.fpInk : Color.fpSurface)
                                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                                .stroke(Color.fpLine, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    // Curator note
                    VStack(alignment: .leading, spacing: FPS.sm) {
                        FPEyebrow(text: "Private note")
                        Text("Anything worth remembering. Dynamics. Signal. Who brought energy.")
                            .font(FPFont.body(13))
                            .foregroundColor(.fpMuted)
                        TextEditor(text: $curatorNote)
                            .font(FPFont.body(15))
                            .foregroundColor(.fpInk)
                            .frame(minHeight: 100)
                            .padding(FPS.sm)
                            .background(Color.fpSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(Color.fpLine, lineWidth: 1)
                            )
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    Button {
                        dismiss()
                    } label: {
                        Text("Save evaluation")
                            .font(FPFont.body(15, weight: .semibold))
                            .foregroundColor(Color.fpBg)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 17)
                            .background(Color.fpInk)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    Spacer(minLength: FPS.screenB)
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("Post-event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.fpMuted)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Member Roster View
// ─────────────────────────────────────────────────────────────────────────────

struct MemberRosterView: View {
    @EnvironmentObject var memberStore: MemberStore
    @State private var filter: FilterOption = .all
    @State private var search = ""
    @State private var showAddMember = false

    enum FilterOption: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case fading = "Fading"
    }

    var filtered: [FPMember] {
        let base: [FPMember]
        switch filter {
        case .all:    base = memberStore.members
        case .active: base = memberStore.active
        case .fading: base = memberStore.fading
        }
        if search.isEmpty { return base }
        return base.filter { $0.displayName.localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {

                // Filter chips
                HStack(spacing: FPS.sm) {
                    ForEach(FilterOption.allCases, id: \.self) { opt in
                        Button {
                            filter = opt
                        } label: {
                            HStack(spacing: 4) {
                                Text(opt.rawValue)
                                    .font(FPFont.body(13, weight: filter == opt ? .semibold : .regular))
                                if opt == .all {
                                    Text("\(memberStore.members.count)")
                                        .font(FPFont.caption(11))
                                        .foregroundColor(.fpDim)
                                } else if opt == .active {
                                    Text("\(memberStore.active.count)")
                                        .font(FPFont.caption(11))
                                        .foregroundColor(.fpDim)
                                } else if opt == .fading {
                                    Text("\(memberStore.fading.count)")
                                        .font(FPFont.caption(11))
                                        .foregroundColor(.fpDim)
                                }
                            }
                            .foregroundColor(filter == opt ? .fpInk : .fpMuted)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(filter == opt ? Color.fpSurface : Color.clear)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(filter == opt ? Color.fpLine : Color.clear, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                    Spacer()
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.vertical, FPS.sm)
                .background(Color.fpBg)

                FPDivider()

                if filtered.isEmpty {
                    Spacer()
                    Text("No members match.")
                        .font(FPFont.body(15))
                        .foregroundColor(.fpDim)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 2) {
                            ForEach(filtered) { member in
                                NavigationLink {
                                    MemberDetailView(member: member)
                                        .environmentObject(memberStore)
                                } label: {
                                    MemberRowView(member: member)
                                }
                                .buttonStyle(.plain)
                                .padding(.horizontal, FPS.screenH)
                            }
                        }
                        .padding(.vertical, FPS.sm)
                        .padding(.bottom, FPS.screenB)
                    }
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .searchable(text: $search, prompt: "Search members")
            .navigationTitle("Roster")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showAddMember = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(.fpInk)
                    }
                }
            }
            .sheet(isPresented: $showAddMember) {
                AddMemberView()
                    .environmentObject(memberStore)
            }
        }
    }
}

struct MemberRowView: View {
    let member: FPMember

    var body: some View {
        HStack(spacing: FPS.md) {
            MemberAvatar(member: member, size: 42)

            VStack(alignment: .leading, spacing: 2) {
                Text(member.displayName)
                    .font(FPFont.body(15, weight: .medium))
                    .foregroundColor(.fpInk)
                HStack(spacing: 6) {
                    FPStatusPill(text: member.status.label, fg: member.status.color, bg: member.status.bgColor)
                    if member.vouchTier == .full {
                        Text("Full trust")
                            .font(FPFont.caption(10))
                            .foregroundColor(.fpDim)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.fpXdim)
        }
        .padding(.vertical, 12)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Member Detail View
// ─────────────────────────────────────────────────────────────────────────────

struct MemberDetailView: View {
    let member: FPMember
    @EnvironmentObject var memberStore: MemberStore
    @EnvironmentObject var stewStore  : StewardshipStore
    @State private var showAddNote = false

    var notes: [FPStewardshipNote] { stewStore.notes(for: member.id) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                // Hero
                HStack(spacing: FPS.md) {
                    MemberAvatar(member: member, size: 64)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(member.displayName)
                            .font(FPFont.serif(24))
                            .foregroundColor(.fpInk)
                        HStack(spacing: 8) {
                            FPStatusPill(text: member.status.label,
                                        fg: member.status.color,
                                        bg: member.status.bgColor)
                            Text(member.vouchTier == .full ? "Full trust" : "Developing")
                                .font(FPFont.caption(11))
                                .foregroundColor(.fpDim)
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.top, FPS.lg)
                .padding(.bottom, FPS.md)

                FPDivider()

                // Info
                VStack(spacing: 0) {
                    if let phone = member.phone {
                        memberInfoRow(label: "Phone", value: phone)
                        FPDivider()
                    }
                    memberInfoRow(label: "Joined",
                                 value: member.joinedAt.formatted(date: .abbreviated, time: .omitted))
                    FPDivider()
                    if let lastAttended = member.lastAttended {
                        memberInfoRow(label: "Last seen",
                                     value: lastAttended.formatted(date: .abbreviated, time: .omitted))
                        FPDivider()
                    }
                    if let voucherId = member.vouchedById,
                       let voucher = memberStore.member(id: voucherId) {
                        memberInfoRow(label: "Vouched by", value: voucher.displayName)
                        FPDivider()
                    }
                }

                // Stewardship notes
                VStack(alignment: .leading, spacing: FPS.md) {
                    HStack {
                        FPEyebrow(text: "Field notes")
                        Spacer()
                        Button {
                            showAddNote = true
                        } label: {
                            Image(systemName: "plus.circle")
                                .foregroundColor(.fpAccent)
                                .font(.system(size: 18))
                        }
                        .buttonStyle(.plain)
                    }

                    if notes.isEmpty {
                        Text("No notes yet. Log signals after gatherings.")
                            .font(FPFont.body(13))
                            .foregroundColor(.fpDim)
                            .italic()
                    } else {
                        ForEach(notes) { note in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Image(systemName: note.signal == .positive ? "arrow.up.circle.fill" : "exclamationmark.circle.fill")
                                        .foregroundColor(note.signal == .positive ? .fpGreen : .fpAmber)
                                        .font(.system(size: 14))
                                    Text(note.createdAt.formatted(date: .abbreviated, time: .omitted))
                                        .font(FPFont.caption(11))
                                        .foregroundColor(.fpDim)
                                    Spacer()
                                }
                                Text(note.text)
                                    .font(FPFont.body(14))
                                    .foregroundColor(.fpInk2)
                                    .lineSpacing(3)
                            }
                            .padding(FPS.md)
                            .background(note.signal == .positive ? Color.fpGreenBg : Color.fpAmberBg)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                    }
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.vertical, FPS.md)

                Spacer(minLength: FPS.screenB)
            }
        }
        .background(Color.fpBg.ignoresSafeArea())
        .navigationTitle(member.firstName)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showAddNote) {
            AddStewardshipNoteView(memberId: member.id)
                .environmentObject(stewStore)
        }
    }

    private func memberInfoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(FPFont.body(14))
                .foregroundColor(.fpMuted)
            Spacer()
            Text(value)
                .font(FPFont.body(14, weight: .medium))
                .foregroundColor(.fpInk2)
        }
        .padding(.horizontal, FPS.screenH)
        .padding(.vertical, 13)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Add Member View
// ─────────────────────────────────────────────────────────────────────────────

struct AddMemberView: View {
    @EnvironmentObject var memberStore: MemberStore
    @Environment(\.dismiss) private var dismiss

    @State private var firstName = ""
    @State private var lastName  = ""
    @State private var phone     = ""
    @State private var tier: FPMember.VouchTier = .developing
    @State private var notes     = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    DoctrineBlock(text: "Referral-first. Every new member enters through someone who vouches with their name attached.")
                        .padding(.horizontal, FPS.screenH)
                        .padding(.top, FPS.md)
                        .padding(.bottom, FPS.md)

                    FPDivider()

                    VStack(alignment: .leading, spacing: FPS.md) {
                        FPEyebrow(text: "Identity")
                        FPTextField(label: "First name", text: $firstName, placeholder: "First")
                        FPTextField(label: "Last name",  text: $lastName,  placeholder: "Last")
                        FPTextField(label: "Phone (optional)", text: $phone, placeholder: "+1 305", keyboardType: .phonePad)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    VStack(alignment: .leading, spacing: FPS.md) {
                        FPEyebrow(text: "Vouch tier")
                        Text("Tier 1: auto-trust — no curator check on future vouches.\nTier 2: curator reviews before new referrals are confirmed.")
                            .font(FPFont.body(13))
                            .foregroundColor(.fpMuted)
                            .lineSpacing(3)

                        Picker("Tier", selection: $tier) {
                            Text("Tier 1 — Full trust").tag(FPMember.VouchTier.full)
                            Text("Tier 2 — Developing").tag(FPMember.VouchTier.developing)
                        }
                        .pickerStyle(.segmented)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    VStack(alignment: .leading, spacing: FPS.md) {
                        FPEyebrow(text: "Private notes")
                        TextEditor(text: $notes)
                            .font(FPFont.body(14))
                            .foregroundColor(.fpInk)
                            .frame(minHeight: 80)
                            .padding(FPS.sm)
                            .background(Color.fpSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(Color.fpLine, lineWidth: 1)
                            )
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    FPDivider()

                    Button {
                        saveMember()
                    } label: {
                        Text("Add to village")
                            .font(FPFont.body(15, weight: .semibold))
                            .foregroundColor(Color.fpBg)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 17)
                            .background(firstName.isEmpty ? Color.fpLine : Color.fpInk)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .disabled(firstName.isEmpty)
                    .buttonStyle(.plain)
                    .padding(.horizontal, FPS.screenH)
                    .padding(.vertical, FPS.md)

                    Spacer(minLength: FPS.screenB)
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("Add member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.fpMuted)
                }
            }
        }
    }

    private func saveMember() {
        let member = FPMember(
            firstName: firstName,
            lastName: lastName,
            status: .active,
            vouchTier: tier,
            phone: phone.isEmpty ? nil : phone,
            notes: notes.isEmpty ? nil : notes
        )
        memberStore.members.append(member)
        dismiss()
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Stewardship View
// ─────────────────────────────────────────────────────────────────────────────

struct StewardshipView: View {
    @EnvironmentObject var stewStore  : StewardshipStore
    @EnvironmentObject var memberStore: MemberStore

    var recentNotes: [FPStewardshipNote] {
        stewStore.notes.sorted { $0.createdAt > $1.createdAt }.prefix(20).map { $0 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {

                    VStack(alignment: .leading, spacing: 6) {
                        FPEyebrow(text: "Curator only")
                        Text("Field")
                            .font(FPFont.serif(34))
                            .foregroundColor(.fpInk)
                        Text("Signal memory. Pattern recognition. Private.")
                            .font(FPFont.body(15))
                            .foregroundColor(.fpMuted)
                    }
                    .padding(.horizontal, FPS.screenH)
                    .padding(.top, FPS.lg)
                    .padding(.bottom, FPS.md)

                    FPDivider()

                    DoctrineBlock(text: "Instinct is early signal, not final verdict. A single observation triggers watchfulness. A pattern triggers conversation. A corroborated pattern triggers action.")
                        .padding(.horizontal, FPS.screenH)
                        .padding(.vertical, FPS.md)

                    FPDivider()

                    if recentNotes.isEmpty {
                        VStack(spacing: FPS.md) {
                            Image(systemName: "eye.slash")
                                .font(.system(size: 36))
                                .foregroundColor(.fpXdim)
                            Text("No signals logged yet.")
                                .font(FPFont.body(15))
                                .foregroundColor(.fpDim)
                            Text("Log after every gathering.\nThe system should feel like writing what you already know.")
                                .font(FPFont.body(13))
                                .foregroundColor(.fpXdim)
                                .multilineTextAlignment(.center)
                                .lineSpacing(3)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, FPS.xxl)
                    } else {
                        VStack(alignment: .leading, spacing: 0) {
                            FPEyebrow(text: "Recent signals")
                                .padding(.horizontal, FPS.screenH)
                                .padding(.vertical, FPS.sm)

                            ForEach(recentNotes) { note in
                                VStack(alignment: .leading, spacing: 0) {
                                    HStack(spacing: FPS.sm) {
                                        Image(systemName: note.signal == .positive ? "arrow.up.circle.fill" : "exclamationmark.circle.fill")
                                            .foregroundColor(note.signal == .positive ? .fpGreen : .fpAmber)
                                            .font(.system(size: 16))
                                        if let member = memberStore.member(id: note.memberId) {
                                            Text(member.displayName)
                                                .font(FPFont.body(14, weight: .semibold))
                                                .foregroundColor(.fpInk)
                                        }
                                        Spacer()
                                        Text(note.createdAt.formatted(date: .abbreviated, time: .omitted))
                                            .font(FPFont.caption(11))
                                            .foregroundColor(.fpDim)
                                    }
                                    .padding(.horizontal, FPS.screenH)
                                    .padding(.top, FPS.md)

                                    Text(note.text)
                                        .font(FPFont.body(14))
                                        .foregroundColor(.fpInk2)
                                        .lineSpacing(3)
                                        .padding(.horizontal, FPS.screenH)
                                        .padding(.top, 4)
                                        .padding(.bottom, FPS.md)

                                    FPDivider()
                                }
                            }
                        }
                    }

                    Spacer(minLength: FPS.screenB)
                }
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("Field")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Add Stewardship Note
// ─────────────────────────────────────────────────────────────────────────────

struct AddStewardshipNoteView: View {
    let memberId: UUID
    @EnvironmentObject var stewStore: StewardshipStore
    @Environment(\.dismiss) private var dismiss

    @State private var signal: FPStewardshipNote.Signal = .concern
    @State private var text = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 0) {

                VStack(alignment: .leading, spacing: FPS.md) {
                    FPEyebrow(text: "Signal type")
                    Picker("Signal", selection: $signal) {
                        Text("Positive").tag(FPStewardshipNote.Signal.positive)
                        Text("Concern").tag(FPStewardshipNote.Signal.concern)
                    }
                    .pickerStyle(.segmented)
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.vertical, FPS.md)

                FPDivider()

                VStack(alignment: .leading, spacing: FPS.sm) {
                    FPEyebrow(text: "Note")
                    TextEditor(text: $text)
                        .font(FPFont.body(15))
                        .foregroundColor(.fpInk)
                        .frame(minHeight: 140)
                        .padding(FPS.sm)
                        .background(Color.fpSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(Color.fpLine, lineWidth: 1)
                        )
                }
                .padding(.horizontal, FPS.screenH)
                .padding(.vertical, FPS.md)

                Spacer()

                Button {
                    let note = FPStewardshipNote(memberId: memberId, signal: signal, text: text)
                    stewStore.add(note)
                    dismiss()
                } label: {
                    Text("Log signal")
                        .font(FPFont.body(15, weight: .semibold))
                        .foregroundColor(Color.fpBg)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 17)
                        .background(text.isEmpty ? Color.fpLine : Color.fpInk)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .disabled(text.isEmpty)
                .buttonStyle(.plain)
                .padding(.horizontal, FPS.screenH)
                .padding(.bottom, FPS.screenB)
            }
            .background(Color.fpBg.ignoresSafeArea())
            .navigationTitle("Log signal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.fpMuted)
                }
            }
        }
    }
}
